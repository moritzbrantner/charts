use serde::{Deserialize, Serialize};

use crate::index::{
    bin_width, bucket_index, clamp_integer, create_zero_metrics, normalize_domain,
    ChartDensityWasmIndex, WasmPoint,
};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HistogramQuery {
    pub bucket_count: f64,
    pub include_empty_buckets: Option<bool>,
    pub value_accessor: Option<WasmValueAccessor>,
    pub value_domain: Option<[f64; 2]>,
    pub x_domain: Option<[f64; 2]>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WasmValueAccessor {
    pub kind: String,
    pub metric: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WasmHistogramBucket {
    pub average_value: Option<f64>,
    pub first_point_index: Option<usize>,
    pub index: usize,
    pub last_point_index: Option<usize>,
    pub max_value: Option<f64>,
    pub metrics: Vec<f64>,
    pub min_value: Option<f64>,
    pub point_count: usize,
    pub sum_value: f64,
    pub value: f64,
    pub value0: f64,
    pub value1: f64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WasmHistogramSummary {
    pub bucket_count: usize,
    pub metrics: Vec<f64>,
    pub point_count: usize,
    pub value_domain: [f64; 2],
    pub x_domain: Option<[f64; 2]>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WasmHistogram {
    pub buckets: Vec<WasmHistogramBucket>,
    pub summary: WasmHistogramSummary,
}

pub fn create_histogram(index: &ChartDensityWasmIndex, query: HistogramQuery) -> WasmHistogram {
    let bucket_count = clamp_integer(query.bucket_count, 1, 100_000);
    let x_domain = query.x_domain.map(normalize_domain);
    let selected_points = index.points_in_x_domain(x_domain);
    let value_accessor = query.value_accessor.unwrap_or_else(|| WasmValueAccessor {
        kind: "y".to_string(),
        metric: None,
    });
    let valued_points = selected_points
        .iter()
        .filter_map(|point| {
            read_point_value(index, point, &value_accessor).map(|value| (point, value))
        })
        .collect::<Vec<_>>();
    let value_domain = normalize_domain(
        query
            .value_domain
            .unwrap_or_else(|| value_domain(&valued_points).unwrap_or([0.0, 0.0])),
    );
    let mut buckets = create_buckets(bucket_count, value_domain, index.metric_count());

    for (point, value) in valued_points {
        if value < value_domain[0] || value > value_domain[1] {
            continue;
        }

        let bucket_index = bucket_index(value, value_domain, bucket_count);

        if let Some(bucket) = buckets.get_mut(bucket_index) {
            update_bucket(bucket, point, value, index.metric_count());
        }
    }

    let visible_buckets = if query.include_empty_buckets == Some(false) {
        buckets
            .into_iter()
            .filter(|bucket| bucket.point_count > 0)
            .collect::<Vec<_>>()
    } else {
        buckets
    };

    WasmHistogram {
        summary: WasmHistogramSummary {
            bucket_count: visible_buckets.len(),
            metrics: sum_bucket_metrics(&visible_buckets, index.metric_count()),
            point_count: visible_buckets
                .iter()
                .map(|bucket| bucket.point_count)
                .sum(),
            value_domain,
            x_domain,
        },
        buckets: visible_buckets,
    }
}

pub fn read_point_value(
    index: &ChartDensityWasmIndex,
    point: &WasmPoint,
    accessor: &WasmValueAccessor,
) -> Option<f64> {
    let value = match accessor.kind.as_str() {
        "x" => point.x,
        "y" => point.y,
        "metric" => {
            let metric_key = accessor.metric.as_ref()?;
            let metric_index = index.metric_index(metric_key)?;

            point.metrics.get(metric_index).copied()?
        }
        _ => point.y,
    };

    value.is_finite().then_some(value)
}

fn create_buckets(
    bucket_count: usize,
    value_domain: [f64; 2],
    metric_count: usize,
) -> Vec<WasmHistogramBucket> {
    let width = bin_width(value_domain, bucket_count);

    (0..bucket_count)
        .map(|index| {
            let value0 = value_domain[0] + index as f64 * width;
            let value1 = if index == bucket_count - 1 {
                value_domain[1]
            } else {
                value_domain[0] + (index + 1) as f64 * width
            };

            WasmHistogramBucket {
                average_value: None,
                first_point_index: None,
                index,
                last_point_index: None,
                max_value: None,
                metrics: create_zero_metrics(metric_count),
                min_value: None,
                point_count: 0,
                sum_value: 0.0,
                value: value_domain[0] + (index as f64 + 0.5) * width,
                value0,
                value1,
            }
        })
        .collect()
}

fn update_bucket(
    bucket: &mut WasmHistogramBucket,
    point: &WasmPoint,
    value: f64,
    metric_count: usize,
) {
    if bucket.first_point_index.is_none() {
        bucket.first_point_index = Some(point.source_index);
    }

    bucket.last_point_index = Some(point.source_index);
    bucket.point_count += 1;
    bucket.sum_value += value;
    bucket.average_value = Some(bucket.sum_value / bucket.point_count as f64);
    bucket.min_value = Some(bucket.min_value.map_or(value, |min| min.min(value)));
    bucket.max_value = Some(bucket.max_value.map_or(value, |max| max.max(value)));

    for metric_index in 0..metric_count {
        bucket.metrics[metric_index] += point.metrics.get(metric_index).copied().unwrap_or(0.0);
    }
}

fn value_domain(valued_points: &[(&WasmPoint, f64)]) -> Option<[f64; 2]> {
    let (_, first_value) = valued_points.first()?;
    let mut min = *first_value;
    let mut max = *first_value;

    for (_, value) in valued_points {
        min = min.min(*value);
        max = max.max(*value);
    }

    Some([min, max])
}

fn sum_bucket_metrics(buckets: &[WasmHistogramBucket], metric_count: usize) -> Vec<f64> {
    let mut totals = create_zero_metrics(metric_count);

    for bucket in buckets {
        for metric_index in 0..metric_count {
            totals[metric_index] += bucket.metrics.get(metric_index).copied().unwrap_or(0.0);
        }
    }

    totals
}

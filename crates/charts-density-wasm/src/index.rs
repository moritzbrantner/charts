use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

use crate::heatmap::{create_heatmap, HeatmapQuery, WasmHeatmap};
use crate::histogram::{create_histogram, HistogramQuery, WasmHistogram};
use crate::percentile::{interpolated_percentile, is_percentile_mode, percentile_value};

#[wasm_bindgen]
pub struct ChartDensityWasmIndex {
    metric_count: usize,
    metric_keys: Vec<String>,
    points: Vec<WasmPoint>,
}

#[derive(Clone)]
pub struct WasmPoint {
    pub metrics: Vec<f64>,
    pub source_index: usize,
    pub x: f64,
    pub y: f64,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct WasmIndexInput {
    metric_keys: Vec<String>,
    metrics: Vec<f64>,
    x: Vec<f64>,
    y: Vec<f64>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BinnedSeriesQuery {
    pub include_empty_bins: Option<bool>,
    pub target_bin_count: f64,
    pub x_domain: [f64; 2],
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChartSeriesQuery {
    pub include_empty_bins: Option<bool>,
    pub percentiles: Option<Vec<String>>,
    pub target_bin_count: f64,
    pub value_mode: Option<String>,
    pub x_domain: [f64; 2],
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WasmBin {
    pub average_y: Option<f64>,
    pub first_point_index: Option<usize>,
    pub index: usize,
    pub last_point_index: Option<usize>,
    pub max_y: Option<f64>,
    pub metrics: Vec<f64>,
    pub min_y: Option<f64>,
    pub p10: Option<f64>,
    pub p25: Option<f64>,
    pub p50: Option<f64>,
    pub p75: Option<f64>,
    pub p90: Option<f64>,
    pub p95: Option<f64>,
    pub p99: Option<f64>,
    pub point_indices: Vec<usize>,
    pub point_count: usize,
    pub sum_y: f64,
    pub x0: f64,
    pub x1: f64,
    #[serde(skip)]
    pub y_values: Vec<f64>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WasmSample {
    pub average_y: Option<f64>,
    pub first_point_index: Option<usize>,
    pub index: usize,
    pub last_point_index: Option<usize>,
    pub max_y: Option<f64>,
    pub metrics: Vec<f64>,
    pub min_y: Option<f64>,
    pub p10: Option<f64>,
    pub p25: Option<f64>,
    pub p50: Option<f64>,
    pub p75: Option<f64>,
    pub p90: Option<f64>,
    pub p95: Option<f64>,
    pub p99: Option<f64>,
    pub point_count: usize,
    pub sum_y: f64,
    pub x: f64,
    pub x0: f64,
    pub x1: f64,
    pub y: Option<f64>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WasmBinnedSeriesSummary {
    pub bin_count: usize,
    pub metrics: Vec<f64>,
    pub point_count: usize,
    pub x_domain: [f64; 2],
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WasmChartSeriesSummary {
    pub bin_count: usize,
    pub metrics: Vec<f64>,
    pub point_count: usize,
    pub sample_count: usize,
    pub value_mode: String,
    pub x_domain: [f64; 2],
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WasmBinnedSeries {
    pub bins: Vec<WasmBin>,
    pub summary: WasmBinnedSeriesSummary,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WasmChartSeries {
    pub bins: Vec<WasmBin>,
    pub samples: Vec<WasmSample>,
    pub summary: WasmChartSeriesSummary,
}

#[wasm_bindgen]
impl ChartDensityWasmIndex {
    #[wasm_bindgen(constructor)]
    pub fn new(input: JsValue) -> Result<ChartDensityWasmIndex, JsValue> {
        let input: WasmIndexInput = serde_wasm_bindgen::from_value(input)?;
        let metric_count = input.metric_keys.len();
        let mut points = Vec::with_capacity(input.x.len().min(input.y.len()));

        for point_index in 0..input.x.len().min(input.y.len()) {
            let x = input.x[point_index];
            let y = input.y[point_index];

            if !x.is_finite() || !y.is_finite() {
                continue;
            }

            let metric_start = point_index * metric_count;
            let mut metrics = Vec::with_capacity(metric_count);

            for metric_index in 0..metric_count {
                metrics.push(
                    input
                        .metrics
                        .get(metric_start + metric_index)
                        .copied()
                        .filter(|value| value.is_finite())
                        .unwrap_or(0.0),
                );
            }

            points.push(WasmPoint {
                metrics,
                source_index: point_index,
                x,
                y,
            });
        }

        points.sort_by(|left, right| left.x.total_cmp(&right.x));

        Ok(Self {
            metric_count,
            metric_keys: input.metric_keys,
            points,
        })
    }

    #[wasm_bindgen(js_name = getBinnedSeries)]
    pub fn get_binned_series(&self, query: JsValue) -> Result<JsValue, JsValue> {
        let query: BinnedSeriesQuery = serde_wasm_bindgen::from_value(query)?;
        let x_domain = normalize_domain(query.x_domain);
        let target_bin_count = clamp_integer(query.target_bin_count, 1, 100_000);
        let mut bins = create_bins(self.metric_count, x_domain, target_bin_count);

        self.populate_bins(&mut bins, x_domain, target_bin_count);

        let visible_bins = if query.include_empty_bins.unwrap_or(false) {
            bins
        } else {
            bins.into_iter().filter(|bin| bin.point_count > 0).collect()
        };
        let summary = create_binned_summary(&visible_bins, x_domain, self.metric_count);
        let series = WasmBinnedSeries {
            bins: visible_bins,
            summary,
        };

        serde_wasm_bindgen::to_value(&series).map_err(Into::into)
    }

    #[wasm_bindgen(js_name = getChartSeries)]
    pub fn get_chart_series(&self, query: JsValue) -> Result<JsValue, JsValue> {
        let query: ChartSeriesQuery = serde_wasm_bindgen::from_value(query)?;
        let x_domain = normalize_domain(query.x_domain);
        let target_bin_count = clamp_integer(query.target_bin_count, 1, 100_000);
        let value_mode = query.value_mode.unwrap_or_else(|| "average".to_string());
        let requested_percentiles = resolve_requested_percentiles(
            query.percentiles.unwrap_or_default(),
            value_mode.as_str(),
        );
        let mut bins = create_bins(self.metric_count, x_domain, target_bin_count);

        self.populate_bins(&mut bins, x_domain, target_bin_count);

        for bin in &mut bins {
            apply_bin_percentiles(bin, &requested_percentiles);
        }

        let bins = if query.include_empty_bins.unwrap_or(false) {
            bins
        } else {
            bins.into_iter().filter(|bin| bin.point_count > 0).collect()
        };
        let samples = bins
            .iter()
            .map(|bin| create_sample(bin, value_mode.as_str()))
            .collect::<Vec<_>>();
        let summary = create_chart_summary(&bins, x_domain, value_mode, self.metric_count);
        let series = WasmChartSeries {
            bins,
            samples,
            summary,
        };

        serde_wasm_bindgen::to_value(&series).map_err(Into::into)
    }

    #[wasm_bindgen(js_name = getHistogram)]
    pub fn get_histogram(&self, query: JsValue) -> Result<JsValue, JsValue> {
        let query: HistogramQuery = serde_wasm_bindgen::from_value(query)?;
        let histogram: WasmHistogram = create_histogram(self, query);

        serde_wasm_bindgen::to_value(&histogram).map_err(Into::into)
    }

    #[wasm_bindgen(js_name = getHeatmap)]
    pub fn get_heatmap(&self, query: JsValue) -> Result<JsValue, JsValue> {
        let query: HeatmapQuery = serde_wasm_bindgen::from_value(query)?;
        let heatmap: WasmHeatmap = create_heatmap(self, query);

        serde_wasm_bindgen::to_value(&heatmap).map_err(Into::into)
    }
}

impl ChartDensityWasmIndex {
    pub fn metric_count(&self) -> usize {
        self.metric_count
    }

    pub fn metric_index(&self, metric_key: &str) -> Option<usize> {
        self.metric_keys
            .iter()
            .position(|candidate| candidate == metric_key)
    }

    pub fn points(&self) -> &[WasmPoint] {
        &self.points
    }

    pub fn points_in_x_domain(&self, x_domain: Option<[f64; 2]>) -> &[WasmPoint] {
        match x_domain {
            Some(domain) => {
                let normalized = normalize_domain(domain);
                let start = lower_bound_by_x(&self.points, normalized[0]);
                let end = upper_bound_by_x(&self.points, normalized[1]);

                &self.points[start..end]
            }
            None => &self.points,
        }
    }

    fn populate_bins(&self, bins: &mut [WasmBin], x_domain: [f64; 2], bin_count: usize) {
        let start = lower_bound_by_x(&self.points, x_domain[0]);
        let end = upper_bound_by_x(&self.points, x_domain[1]);

        for point in &self.points[start..end] {
            let bin_index = bucket_index(point.x, x_domain, bin_count);

            if let Some(bin) = bins.get_mut(bin_index) {
                update_bin(bin, point, self.metric_count);
            }
        }
    }
}

pub fn normalize_domain(domain: [f64; 2]) -> [f64; 2] {
    let left = if domain[0].is_finite() {
        domain[0]
    } else {
        0.0
    };
    let right = if domain[1].is_finite() {
        domain[1]
    } else {
        left
    };

    if left <= right {
        [left, right]
    } else {
        [right, left]
    }
}

pub fn clamp_integer(value: f64, min: usize, max: usize) -> usize {
    if !value.is_finite() {
        return min;
    }

    (value.floor() as isize).clamp(min as isize, max as isize) as usize
}

pub fn bin_width(domain: [f64; 2], bin_count: usize) -> f64 {
    let span = domain[1] - domain[0];

    if span > 0.0 {
        span / bin_count as f64
    } else {
        1.0
    }
}

pub fn bucket_index(value: f64, domain: [f64; 2], bucket_count: usize) -> usize {
    let width = bin_width(domain, bucket_count);
    let index = ((value - domain[0]) / width).floor() as isize;

    index.clamp(0, bucket_count.saturating_sub(1) as isize) as usize
}

pub fn lower_bound_by_x(points: &[WasmPoint], x: f64) -> usize {
    let mut low = 0;
    let mut high = points.len();

    while low < high {
        let middle = (low + high) / 2;

        if points[middle].x < x {
            low = middle + 1;
        } else {
            high = middle;
        }
    }

    low
}

pub fn upper_bound_by_x(points: &[WasmPoint], x: f64) -> usize {
    let mut low = 0;
    let mut high = points.len();

    while low < high {
        let middle = (low + high) / 2;

        if points[middle].x <= x {
            low = middle + 1;
        } else {
            high = middle;
        }
    }

    low
}

pub fn create_zero_metrics(metric_count: usize) -> Vec<f64> {
    vec![0.0; metric_count]
}

fn create_bins(metric_count: usize, x_domain: [f64; 2], bin_count: usize) -> Vec<WasmBin> {
    let width = bin_width(x_domain, bin_count);

    (0..bin_count)
        .map(|index| {
            let x0 = x_domain[0] + index as f64 * width;
            let x1 = if index == bin_count - 1 {
                x_domain[1]
            } else {
                x_domain[0] + (index + 1) as f64 * width
            };

            WasmBin {
                average_y: None,
                first_point_index: None,
                index,
                last_point_index: None,
                max_y: None,
                metrics: create_zero_metrics(metric_count),
                min_y: None,
                p10: None,
                p25: None,
                p50: None,
                p75: None,
                p90: None,
                p95: None,
                p99: None,
                point_indices: Vec::new(),
                point_count: 0,
                sum_y: 0.0,
                x0,
                x1,
                y_values: Vec::new(),
            }
        })
        .collect()
}

fn update_bin(bin: &mut WasmBin, point: &WasmPoint, metric_count: usize) {
    if bin.first_point_index.is_none() {
        bin.first_point_index = Some(point.source_index);
    }

    bin.last_point_index = Some(point.source_index);
    bin.point_count += 1;
    bin.point_indices.push(point.source_index);
    bin.y_values.push(point.y);
    bin.sum_y += point.y;
    bin.average_y = Some(bin.sum_y / bin.point_count as f64);
    bin.min_y = Some(bin.min_y.map_or(point.y, |min| min.min(point.y)));
    bin.max_y = Some(bin.max_y.map_or(point.y, |max| max.max(point.y)));

    for metric_index in 0..metric_count {
        bin.metrics[metric_index] += point.metrics.get(metric_index).copied().unwrap_or(0.0);
    }
}

fn apply_bin_percentiles(bin: &mut WasmBin, percentiles: &[String]) {
    if bin.point_count == 0 || percentiles.is_empty() {
        return;
    }

    for percentile in percentiles {
        let Some(percentile_value) = percentile_value(percentile) else {
            continue;
        };
        let mut sorted_values = bin.y_values.clone();
        let value = interpolated_percentile(&mut sorted_values, percentile_value);

        match percentile.as_str() {
            "p10" => bin.p10 = value,
            "p25" => bin.p25 = value,
            "p50" => bin.p50 = value,
            "p75" => bin.p75 = value,
            "p90" => bin.p90 = value,
            "p95" => bin.p95 = value,
            "p99" => bin.p99 = value,
            _ => {}
        }
    }
}

fn create_sample(bin: &WasmBin, value_mode: &str) -> WasmSample {
    WasmSample {
        average_y: bin.average_y,
        first_point_index: bin.first_point_index,
        index: bin.index,
        last_point_index: bin.last_point_index,
        max_y: bin.max_y,
        metrics: bin.metrics.clone(),
        min_y: bin.min_y,
        p10: bin.p10,
        p25: bin.p25,
        p50: bin.p50,
        p75: bin.p75,
        p90: bin.p90,
        p95: bin.p95,
        p99: bin.p99,
        point_count: bin.point_count,
        sum_y: bin.sum_y,
        x: (bin.x0 + bin.x1) / 2.0,
        x0: bin.x0,
        x1: bin.x1,
        y: chart_density_value(bin, value_mode),
    }
}

fn chart_density_value(bin: &WasmBin, value_mode: &str) -> Option<f64> {
    if bin.point_count == 0 {
        return None;
    }

    match value_mode {
        "average" => bin.average_y,
        "count" => Some(bin.point_count as f64),
        "max" => bin.max_y,
        "min" => bin.min_y,
        "sum" => Some(bin.sum_y),
        "p10" => bin.p10,
        "p25" => bin.p25,
        "p50" => bin.p50,
        "p75" => bin.p75,
        "p90" => bin.p90,
        "p95" => bin.p95,
        "p99" => bin.p99,
        _ => bin.average_y,
    }
}

fn create_binned_summary(
    bins: &[WasmBin],
    x_domain: [f64; 2],
    metric_count: usize,
) -> WasmBinnedSeriesSummary {
    WasmBinnedSeriesSummary {
        bin_count: bins.len(),
        metrics: sum_bin_metrics(bins, metric_count),
        point_count: bins.iter().map(|bin| bin.point_count).sum(),
        x_domain,
    }
}

fn create_chart_summary(
    bins: &[WasmBin],
    x_domain: [f64; 2],
    value_mode: String,
    metric_count: usize,
) -> WasmChartSeriesSummary {
    WasmChartSeriesSummary {
        bin_count: bins.len(),
        metrics: sum_bin_metrics(bins, metric_count),
        point_count: bins.iter().map(|bin| bin.point_count).sum(),
        sample_count: bins.len(),
        value_mode,
        x_domain,
    }
}

fn sum_bin_metrics(bins: &[WasmBin], metric_count: usize) -> Vec<f64> {
    let mut totals = create_zero_metrics(metric_count);

    for bin in bins {
        for metric_index in 0..metric_count {
            totals[metric_index] += bin.metrics.get(metric_index).copied().unwrap_or(0.0);
        }
    }

    totals
}

fn resolve_requested_percentiles(mut percentiles: Vec<String>, value_mode: &str) -> Vec<String> {
    if is_percentile_mode(value_mode) && !percentiles.iter().any(|item| item == value_mode) {
        percentiles.push(value_mode.to_string());
    }

    percentiles
}

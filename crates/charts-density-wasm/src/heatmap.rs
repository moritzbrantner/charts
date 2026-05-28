use serde::{Deserialize, Serialize};

use crate::histogram::{read_point_value, WasmValueAccessor};
use crate::index::{
    bin_width, bucket_index, clamp_integer, create_zero_metrics, normalize_domain,
    ChartDensityWasmIndex, WasmPoint,
};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HeatmapQuery {
    pub include_empty_cells: Option<bool>,
    pub value_accessor: Option<WasmValueAccessor>,
    pub x_bin_count: f64,
    pub x_domain: [f64; 2],
    pub y_bin_count: f64,
    pub y_domain: Option<[f64; 2]>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WasmHeatmapCell {
    pub average_value: Option<f64>,
    pub first_point_index: Option<usize>,
    pub index: usize,
    pub last_point_index: Option<usize>,
    pub metrics: Vec<f64>,
    pub point_count: usize,
    pub sum_value: f64,
    pub value: f64,
    pub x: f64,
    pub x0: f64,
    pub x1: f64,
    pub x_index: usize,
    pub y: f64,
    pub y0: f64,
    pub y1: f64,
    pub y_index: usize,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WasmHeatmapSummary {
    pub max_cell_count: usize,
    pub metrics: Vec<f64>,
    pub point_count: usize,
    pub x_bin_count: usize,
    pub x_domain: [f64; 2],
    pub y_bin_count: usize,
    pub y_domain: [f64; 2],
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WasmHeatmap {
    pub cells: Vec<WasmHeatmapCell>,
    pub summary: WasmHeatmapSummary,
}

pub fn create_heatmap(index: &ChartDensityWasmIndex, query: HeatmapQuery) -> WasmHeatmap {
    let x_bin_count = clamp_integer(query.x_bin_count, 1, 100_000);
    let y_bin_count = clamp_integer(query.y_bin_count, 1, 100_000);
    let x_domain = normalize_domain(query.x_domain);
    let selected_points = index.points_in_x_domain(Some(x_domain));
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
    let y_domain = normalize_domain(
        query
            .y_domain
            .unwrap_or_else(|| value_domain(&valued_points).unwrap_or([0.0, 0.0])),
    );
    let mut cells = create_cells(
        x_bin_count,
        y_bin_count,
        x_domain,
        y_domain,
        index.metric_count(),
    );

    for (point, value) in valued_points {
        if value < y_domain[0] || value > y_domain[1] {
            continue;
        }

        let x_index = bucket_index(point.x, x_domain, x_bin_count);
        let y_index = bucket_index(value, y_domain, y_bin_count);
        let cell_index = y_index * x_bin_count + x_index;

        if let Some(cell) = cells.get_mut(cell_index) {
            update_cell(cell, point, value, index.metric_count());
        }
    }

    let max_cell_count = cells.iter().map(|cell| cell.point_count).max().unwrap_or(0);

    for cell in &mut cells {
        cell.value = if max_cell_count > 0 {
            cell.point_count as f64 / max_cell_count as f64
        } else {
            0.0
        };
    }

    let visible_cells = if query.include_empty_cells == Some(false) {
        cells
            .into_iter()
            .filter(|cell| cell.point_count > 0)
            .collect::<Vec<_>>()
    } else {
        cells
    };

    WasmHeatmap {
        summary: WasmHeatmapSummary {
            max_cell_count,
            metrics: sum_cell_metrics(&visible_cells, index.metric_count()),
            point_count: visible_cells.iter().map(|cell| cell.point_count).sum(),
            x_bin_count,
            x_domain,
            y_bin_count,
            y_domain,
        },
        cells: visible_cells,
    }
}

fn create_cells(
    x_bin_count: usize,
    y_bin_count: usize,
    x_domain: [f64; 2],
    y_domain: [f64; 2],
    metric_count: usize,
) -> Vec<WasmHeatmapCell> {
    let x_width = bin_width(x_domain, x_bin_count);
    let y_width = bin_width(y_domain, y_bin_count);

    (0..x_bin_count * y_bin_count)
        .map(|index| {
            let x_index = index % x_bin_count;
            let y_index = index / x_bin_count;
            let x0 = x_domain[0] + x_index as f64 * x_width;
            let y0 = y_domain[0] + y_index as f64 * y_width;

            WasmHeatmapCell {
                average_value: None,
                first_point_index: None,
                index,
                last_point_index: None,
                metrics: create_zero_metrics(metric_count),
                point_count: 0,
                sum_value: 0.0,
                value: 0.0,
                x: x0 + x_width / 2.0,
                x0,
                x1: if x_index == x_bin_count - 1 {
                    x_domain[1]
                } else {
                    x0 + x_width
                },
                x_index,
                y: y0 + y_width / 2.0,
                y0,
                y1: if y_index == y_bin_count - 1 {
                    y_domain[1]
                } else {
                    y0 + y_width
                },
                y_index,
            }
        })
        .collect()
}

fn update_cell(cell: &mut WasmHeatmapCell, point: &WasmPoint, value: f64, metric_count: usize) {
    if cell.first_point_index.is_none() {
        cell.first_point_index = Some(point.source_index);
    }

    cell.last_point_index = Some(point.source_index);
    cell.point_count += 1;
    cell.sum_value += value;
    cell.average_value = Some(cell.sum_value / cell.point_count as f64);

    for metric_index in 0..metric_count {
        cell.metrics[metric_index] += point.metrics.get(metric_index).copied().unwrap_or(0.0);
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

fn sum_cell_metrics(cells: &[WasmHeatmapCell], metric_count: usize) -> Vec<f64> {
    let mut totals = create_zero_metrics(metric_count);

    for cell in cells {
        for metric_index in 0..metric_count {
            totals[metric_index] += cell.metrics.get(metric_index).copied().unwrap_or(0.0);
        }
    }

    totals
}

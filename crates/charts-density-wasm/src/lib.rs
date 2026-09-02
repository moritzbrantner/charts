use serde::Serialize;
use wasm_bindgen::prelude::*;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct DensityBin {
    index: usize,
    x0: f64,
    x1: f64,
    point_count: usize,
    sum_y: f64,
    average_y: Option<f64>,
    min_y: Option<f64>,
    max_y: Option<f64>,
}

/// Aggregate sorted or unsorted x/y pairs into fixed-width x-domain bins.
///
/// This crate deliberately owns only hot numeric kernels. Chart-specific
/// semantics, point metadata, rendering, interaction, and accessibility stay
/// in TypeScript.
#[wasm_bindgen]
pub fn aggregate_density_bins(
    x: &[f64],
    y: &[f64],
    domain_min: f64,
    domain_max: f64,
    bin_count: usize,
) -> Result<JsValue, JsValue> {
    if !domain_min.is_finite() || !domain_max.is_finite() || domain_max <= domain_min {
        return Err(JsValue::from_str("density domain must be finite and increasing"));
    }
    if bin_count == 0 {
        return Err(JsValue::from_str("bin_count must be greater than zero"));
    }

    let point_count = x.len().min(y.len());
    let width = (domain_max - domain_min) / bin_count as f64;
    let mut counts = vec![0usize; bin_count];
    let mut sums = vec![0.0f64; bin_count];
    let mut mins = vec![f64::INFINITY; bin_count];
    let mut maxs = vec![f64::NEG_INFINITY; bin_count];

    for index in 0..point_count {
        let point_x = x[index];
        let point_y = y[index];
        if !point_x.is_finite() || !point_y.is_finite() || point_x < domain_min || point_x > domain_max {
            continue;
        }

        let raw = ((point_x - domain_min) / width).floor() as isize;
        let bin_index = raw.clamp(0, bin_count as isize - 1) as usize;
        counts[bin_index] += 1;
        sums[bin_index] += point_y;
        mins[bin_index] = mins[bin_index].min(point_y);
        maxs[bin_index] = maxs[bin_index].max(point_y);
    }

    let bins: Vec<DensityBin> = (0..bin_count)
        .map(|index| {
            let count = counts[index];
            DensityBin {
                index,
                x0: domain_min + width * index as f64,
                x1: if index + 1 == bin_count {
                    domain_max
                } else {
                    domain_min + width * (index + 1) as f64
                },
                point_count: count,
                sum_y: sums[index],
                average_y: (count > 0).then(|| sums[index] / count as f64),
                min_y: (count > 0).then(|| mins[index]),
                max_y: (count > 0).then(|| maxs[index]),
            }
        })
        .collect();

    serde_wasm_bindgen::to_value(&bins).map_err(|error| JsValue::from_str(&error.to_string()))
}

#[wasm_bindgen]
pub fn percentile(values: &[f64], quantile: f64) -> Result<f64, JsValue> {
    if !(0.0..=1.0).contains(&quantile) || !quantile.is_finite() {
        return Err(JsValue::from_str("quantile must be between 0 and 1"));
    }

    let mut finite: Vec<f64> = values.iter().copied().filter(|value| value.is_finite()).collect();
    if finite.is_empty() {
        return Ok(f64::NAN);
    }
    finite.sort_by(f64::total_cmp);

    let position = quantile * (finite.len() - 1) as f64;
    let lower = position.floor() as usize;
    let upper = position.ceil() as usize;
    if lower == upper {
        return Ok(finite[lower]);
    }

    let weight = position - lower as f64;
    // Keep the arithmetic order identical to the TypeScript correctness baseline so
    // differential parity is bit-for-bit stable instead of differing at machine epsilon.
    Ok(finite[lower] + (finite[upper] - finite[lower]) * weight)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn percentile_interpolates() {
        let value = percentile(&[1.0, 2.0, 3.0, 4.0], 0.5).unwrap();
        assert_eq!(value, 2.5);
    }

    #[test]
    fn percentile_matches_js_interpolation_order() {
        let values = [
            -9.99292788975378,
            -8.786348636508595,
            -3.1402410771695273,
            0.9148611651613017,
            5.730800598311313,
        ];
        let value = percentile(&values, 0.25).unwrap();
        let position = (values.len() - 1) as f64 * 0.25;
        let lower = position.floor() as usize;
        let upper = position.ceil() as usize;
        let expected = values[lower] + (values[upper] - values[lower]) * (position - lower as f64);

        assert_eq!(value, expected);
    }
}

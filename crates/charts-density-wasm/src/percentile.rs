pub fn interpolated_percentile_sorted(values: &[f64], percentile: f64) -> Option<f64> {
    if values.is_empty() {
        return None;
    }

    if values.len() == 1 {
        return values.first().copied();
    }

    let position = (values.len() - 1) as f64 * percentile;
    let lower_index = position.floor() as usize;
    let upper_index = position.ceil() as usize;
    let lower = values.get(lower_index).copied()?;
    let upper = values.get(upper_index).copied()?;

    Some(lower + (upper - lower) * (position - lower_index as f64))
}

pub fn percentile_value(mode: &str) -> Option<f64> {
    match mode {
        "p10" => Some(0.1),
        "p25" => Some(0.25),
        "p50" => Some(0.5),
        "p75" => Some(0.75),
        "p90" => Some(0.9),
        "p95" => Some(0.95),
        "p99" => Some(0.99),
        _ => None,
    }
}

pub fn is_percentile_mode(mode: &str) -> bool {
    percentile_value(mode).is_some()
}

const BIN_STRIDE: usize = 6;
const COUNT: usize = 0;
const SUM: usize = 1;
const MIN: usize = 2;
const MAX: usize = 3;
const FIRST: usize = 4;
const LAST: usize = 5;

struct DensityIndex {
    x: Vec<f64>,
    y: Vec<f64>,
}

#[no_mangle]
pub extern "C" fn alloc_f64(length: usize) -> *mut f64 {
    let mut values = Vec::<f64>::with_capacity(length);
    let pointer = values.as_mut_ptr();
    std::mem::forget(values);
    pointer
}

#[no_mangle]
pub unsafe extern "C" fn dealloc_f64(pointer: *mut f64, length: usize) {
    if pointer.is_null() {
        return;
    }

    drop(Vec::from_raw_parts(pointer, 0, length));
}

#[no_mangle]
pub unsafe extern "C" fn create_index(
    x_pointer: *const f64,
    y_pointer: *const f64,
    length: usize,
) -> *mut DensityIndex {
    if (x_pointer.is_null() || y_pointer.is_null()) && length > 0 {
        return std::ptr::null_mut();
    }

    let x = std::slice::from_raw_parts(x_pointer, length).to_vec();
    let y = std::slice::from_raw_parts(y_pointer, length).to_vec();

    Box::into_raw(Box::new(DensityIndex { x, y }))
}

#[no_mangle]
pub unsafe extern "C" fn free_index(pointer: *mut DensityIndex) {
    if !pointer.is_null() {
        drop(Box::from_raw(pointer));
    }
}

#[no_mangle]
pub unsafe extern "C" fn bin_series(
    index_pointer: *const DensityIndex,
    min_x: f64,
    max_x: f64,
    bin_count: usize,
    output_pointer: *mut f64,
) -> usize {
    if index_pointer.is_null() || output_pointer.is_null() || bin_count == 0 {
        return 0;
    }

    let index = &*index_pointer;
    let output_length = bin_count * BIN_STRIDE;
    let output = std::slice::from_raw_parts_mut(output_pointer, output_length);

    initialize_bins(output, bin_count);

    let span = max_x - min_x;
    let bin_width = if span > 0.0 {
        span / bin_count as f64
    } else {
        1.0
    };

    for (point_index, (&x, &y)) in index.x.iter().zip(&index.y).enumerate() {
        if x < min_x || x > max_x {
            continue;
        }

        let raw_bin = ((x - min_x) / bin_width).floor();
        let bin_index = if !raw_bin.is_finite() || raw_bin <= 0.0 {
            0
        } else {
            (raw_bin as usize).min(bin_count - 1)
        };
        update_bin(output, bin_index, point_index, y);
    }

    output_length
}

fn initialize_bins(output: &mut [f64], bin_count: usize) {
    for bin_index in 0..bin_count {
        let offset = bin_index * BIN_STRIDE;
        output[offset + COUNT] = 0.0;
        output[offset + SUM] = 0.0;
        output[offset + MIN] = f64::INFINITY;
        output[offset + MAX] = f64::NEG_INFINITY;
        output[offset + FIRST] = -1.0;
        output[offset + LAST] = -1.0;
    }
}

fn update_bin(output: &mut [f64], bin_index: usize, point_index: usize, y: f64) {
    let offset = bin_index * BIN_STRIDE;
    let count = output[offset + COUNT];

    output[offset + COUNT] = count + 1.0;
    output[offset + SUM] += y;
    output[offset + MIN] = output[offset + MIN].min(y);
    output[offset + MAX] = output[offset + MAX].max(y);

    if count == 0.0 {
        output[offset + FIRST] = point_index as f64;
    }
    output[offset + LAST] = point_index as f64;
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn bins_duplicate_and_boundary_points() {
        let index = DensityIndex {
            x: vec![0.0, 0.0, 5.0, 10.0],
            y: vec![2.0, 8.0, -4.0, 6.0],
        };
        let mut output = vec![0.0; 2 * BIN_STRIDE];

        unsafe {
            let written = bin_series(&index, 0.0, 10.0, 2, output.as_mut_ptr());
            assert_eq!(written, output.len());
        }

        assert_eq!(output[COUNT], 2.0);
        assert_eq!(output[SUM], 10.0);
        assert_eq!(output[MIN], 2.0);
        assert_eq!(output[MAX], 8.0);
        assert_eq!(output[FIRST], 0.0);
        assert_eq!(output[LAST], 1.0);

        let second = BIN_STRIDE;
        assert_eq!(output[second + COUNT], 2.0);
        assert_eq!(output[second + SUM], 2.0);
        assert_eq!(output[second + MIN], -4.0);
        assert_eq!(output[second + MAX], 6.0);
        assert_eq!(output[second + FIRST], 2.0);
        assert_eq!(output[second + LAST], 3.0);
    }
}

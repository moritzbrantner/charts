mod heatmap;
mod histogram;
mod index;
mod percentile;

use wasm_bindgen::prelude::*;

pub use index::ChartDensityWasmIndex;

#[wasm_bindgen(start)]
pub fn start() {
    console_error_panic_hook::set_once();
}

import type { UserConfig } from "unlighthouse/config";

const config: UserConfig = {
  ci: {
    budget: 90,
    reporter: "jsonExpanded",
  },
  lighthouseOptions: {
    throttling: {
      cpuSlowdownMultiplier: 1,
      downloadThroughputKbps: 0,
      requestLatencyMs: 0,
      rttMs: 0,
      throughputKbps: 0,
      uploadThroughputKbps: 0,
    },
    throttlingMethod: "provided",
  },
  puppeteerOptions: {
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
  scanner: {
    device: "desktop",
    include: ["/", "/compose.html"],
    samples: 1,
  },
  site: "http://127.0.0.1:41736",
};

export default config;

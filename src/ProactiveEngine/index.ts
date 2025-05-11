import { Orchestrator } from "@/middleware/orchestrator";
import cron from "node-cron";

export class ProactiveEngine {
  constructor(private orchestrator: Orchestrator) {}

  async run() {
    // Schedule a cron job to run every 5 minutes
    console.log(
      "Starting cron job to fetch data from the database every 5 minutes"
    );
    cron.schedule("*/5 * * * *", async () => {
      console.log("Cron job started: Fetching data from the database");
      try {
        await this.orchestrator.runPendingActions();
        console.log("Cron job completed successfully");
      } catch (error) {
        console.error("Error during cron job execution:", error);
      }
    });
    // Cron job to run every day to get updates from the moodle server
    console.log(
      "Starting cron job to fetch data from the Moodle server every day"
    );
    cron.schedule("0 0 * * *", async () => {
      console.log("Cron job started: Fetching data from the Moodle server");
      try {
        await this.orchestrator.fetchMoodleUpdates();
        console.log("Cron job completed successfully");
      } catch (error) {
        console.error("Error during cron job execution:", error);
      }
    });
  }
}


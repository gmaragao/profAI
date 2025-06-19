import { Orchestrator } from "@/Middleware/orchestrator";
import cron from "node-cron";

export class ProactiveEngine {
  constructor(private orchestrator: Orchestrator) {}

  async run() {
    const cronFrequencyMinutes = process.env.CRON_FREQUENCY_MINUTES || "5";
    const cronFrequency = `*/${cronFrequencyMinutes} * * * *`;

    if (!cron.validate(cronFrequency)) {
      throw new Error(`Invalid cron frequency: ${cronFrequency}`);
    }
    console.log(
      `Starting cron job to fetch data from the database every ${cronFrequencyMinutes} minutes`
    );
    cron.schedule(cronFrequency, async () => {
      console.log(
        "Cron job started: Get updates, classify posts and generate actions"
      );
      try {
        await this.orchestrator.generateActions();
        console.log("Cron job completed successfully");
      } catch (error) {
        console.error("Error during cron job execution:", error);
      }
    });
  }
}

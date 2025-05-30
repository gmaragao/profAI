import { callMoodle } from "./callMoodle";
import { moodleModuleDispatchMap, MoodleModuleType } from "./moduleDispatchMap";

async function fetchModuleDetails(
  modname: string,
  instanceId: number,
  update: any
) {
  const handler = moodleModuleDispatchMap[modname as MoodleModuleType];

  if (!handler) {
    throw new Error(`Unsupported module type: ${modname}`);
  }

  const params = handler.paramBuilder(instanceId, update);

  const result = await callMoodle({ function: handler.detailApi, params });
  return result;
}

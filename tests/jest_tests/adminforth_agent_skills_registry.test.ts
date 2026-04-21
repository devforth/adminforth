import { mkdtemp, mkdir, rm, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import {
  listProjectSkillManifests,
  loadSkillMarkdown,
} from "../../plugins/adminforth-agent/agent/skills/registry.js";

const SKILL_MARKDOWN = (name: string, description: string, body: string) => `name: ${name}
description: ${description}
---

${body}
`;

describe("adminforth-agent skills registry", () => {
  let customComponentsDir: string;

  beforeEach(async () => {
    customComponentsDir = await mkdtemp(
      path.join(os.tmpdir(), "adminforth-agent-skills-"),
    );
  });

  afterEach(async () => {
    await rm(customComponentsDir, { recursive: true, force: true });
  });

  it("collects skills from both user custom skill directories", async () => {
    const rootSkillDir = path.join(customComponentsDir, "skills", "root-skill");
    const pluginSkillDir = path.join(
      customComponentsDir,
      "plugins",
      "adminforth-agent",
      "skills",
      "plugin-skill",
    );

    await mkdir(rootSkillDir, { recursive: true });
    await mkdir(pluginSkillDir, { recursive: true });

    await writeFile(
      path.join(rootSkillDir, "SKILL.md"),
      SKILL_MARKDOWN("root-skill", "Root custom skill", "Root body"),
      "utf8",
    );
    await writeFile(
      path.join(pluginSkillDir, "SKILL.md"),
      SKILL_MARKDOWN("plugin-skill", "Plugin custom skill", "Plugin body"),
      "utf8",
    );

    const skills = await listProjectSkillManifests(customComponentsDir);

    expect(skills.map((skill) => skill.name)).toEqual([
      "root-skill",
      "plugin-skill",
    ]);
  });

  it("loads markdown from the plugin-scoped user custom directory", async () => {
    const pluginSkillDir = path.join(
      customComponentsDir,
      "plugins",
      "adminforth-agent",
      "skills",
      "plugin-skill",
    );

    await mkdir(pluginSkillDir, { recursive: true });
    await writeFile(
      path.join(pluginSkillDir, "SKILL.md"),
      SKILL_MARKDOWN("plugin-skill", "Plugin custom skill", "Plugin body"),
      "utf8",
    );

    await expect(loadSkillMarkdown("plugin-skill", customComponentsDir)).resolves.toContain(
      "Plugin body",
    );
  });
});
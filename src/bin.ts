#!/usr/bin/env node
/** zh-ctf-lab — Academy protocol-lab orchestrator: catalog, plan, report and flag. Pure code, no docker engine required. */

import { Command } from "commander";
import { table, truncate } from "@zerohack/shared";
import { generateFlag, validateFlag } from "./flag.ts";
import { buildPlan } from "./plan.ts";
import { createReport } from "./report.ts";
import { FLAG_PATTERN_STRING, list, scenario } from "./scenarios.ts";

const program = new Command();

program
  .name("zh-ctf-lab")
  .description("Academy protocol-lab — catalog scenarios, plan containers, build ready reports and mint flags. No docker required.")
  .version("0.1.0", "-v, --version")
  .showHelpAfterError();

program
  .command("list")
  .description("List the catalog scenarios sorted by id")
  .option("-j, --json", "print raw JSON")
  .action((options) => {
    const rows = list();
    if (options.json) {
      console.log(JSON.stringify(rows, null, 2));
      return;
    }
    console.log(
      table({
        headers: ["ID", "Title", "Protocol", "Difficulty", "Services", "Timeout"],
        rows: rows.map((s) => [s.id, s.title, s.protocol, s.difficulty, String(s.services.length), `${s.timeoutS}s`]),
      })
    );
  });

program
  .command("scenario")
  .description("Show one scenario")
  .argument("<id>")
  .option("-j, --json", "print raw JSON")
  .action((id, options) => {
    const s = scenario(id);
    if (!s) {
      console.error(`zh-ctf-lab: unknown scenario "${id}"`);
      process.exit(1);
    }
    if (options.json) {
      console.log(JSON.stringify(s, null, 2));
      return;
    }
    console.log(
      table({
        headers: ["Field", "Value"],
        rows: [
          ["ID", s.id],
          ["Title", s.title],
          ["Protocol", s.protocol],
          ["Difficulty", s.difficulty],
          ["Learning path", s.learningPath],
          ["Tags", s.tags.join(", ")],
          ["Flag env", s.flagEnv],
          ["Flag pattern", s.flagPattern ?? FLAG_PATTERN_STRING],
          ["Timeout", `${s.timeoutS}s`],
          ["Services", String(s.services.length)],
        ],
      })
    );
    console.log(truncate(s.description, 200));
  });

program
  .command("plan")
  .description("Print the deterministic container plan for a scenario")
  .argument("<id>")
  .option("-j, --json", "print raw JSON")
  .action((id, options) => {
    let plans;
    try {
      plans = buildPlan(id);
    } catch (err) {
      console.error(`zh-ctf-lab: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
    if (options.json) {
      console.log(JSON.stringify(plans, null, 2));
      return;
    }
    console.log(
      table({
        headers: ["Container", "Image", "Network", "Ports", "Env"],
        rows: plans.map((p) => [
          p.name,
          p.image,
          p.network,
          p.portBindings.length ? p.portBindings.map((b) => `${b.host}:${b.container}`).join(", ") : "(dynamic)",
          Object.entries(p.env)
            .map(([k, v]) => `${k}=${v}`)
            .join(" "),
        ]),
      })
    );
    console.log("docker run hints:");
    for (const p of plans) {
      const ports = p.portBindings.map((b) => `-p ${b.host}:${b.container}`).join(" ");
      const envs = Object.entries(p.env)
        .map(([k, v]) => `-e ${k}=${v}`)
        .join(" ");
      const cmd = p.cmd ? ` ${p.cmd.join(" ")}` : "";
      console.log(`  docker run --rm -d --name ${p.name} --network ${p.network} ${ports} ${envs} ${p.image}${cmd}`.replace(/\s+/g, " ").trim());
    }
  });

program
  .command("report")
  .description("Build a ready LabReport for a scenario")
  .argument("<id>")
  .option("-j, --json", "print raw JSON")
  .action((id, options) => {
    const report = createReport(id);
    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
      return;
    }
    console.log(
      table({
        headers: ["Container", "Endpoint"],
        rows: report.containers.map((c, i) => [c, report.endpoints[i] ?? "—"]),
      })
    );
    console.log(`status: ${report.status} · ${report.containers.length} container(s) · ${report.endpoints.length} endpoint(s)`);
  });

program
  .command("flag")
  .description("Mint a flag for a scenario, or verify a submitted one")
  .argument("<id>")
  .option("--set <value>", "verify a submitted flag instead of minting")
  .action((id, options) => {
    const s = scenario(id);
    if (!s) {
      console.error(`zh-ctf-lab: unknown scenario "${id}"`);
      process.exit(1);
    }
    if (options.set !== undefined) {
      try {
        const flag = validateFlag(options.set);
        console.log(`${s.flagEnv}=${flag}  valid`);
      } catch (err) {
        console.error(`zh-ctf-lab: ${err instanceof Error ? err.message : String(err)}`);
        process.exit(1);
      }
      return;
    }
    const { env, flag } = generateFlag(s);
    console.log(`${env}=${flag}`);
    console.log(`pattern: ${s.flagPattern ?? FLAG_PATTERN_STRING}`);
  });

program.parseAsync(process.argv).catch((err) => {
  console.error(`zh-ctf-lab: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
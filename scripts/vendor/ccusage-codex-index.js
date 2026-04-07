#!/usr/bin/env node
import { createRequire } from "node:module";
import process$1 from "node:process";
import { formatWithOptions } from "node:util";
import os from "node:os";
import path, { basename, dirname, normalize, posix, relative, resolve, sep } from "node:path";
import a, { readFile, stat } from "node:fs/promises";
import * as nativeFs from "node:fs";
import b from "node:fs";
import { fileURLToPath } from "node:url";
import * as tty from "node:tty";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJSMin = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i$1 = 0, n$2 = keys.length, key; i$1 < n$2; i$1++) {
		key = keys[i$1];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k$1) => from[k$1]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
var __require$1 = /* @__PURE__ */ createRequire(import.meta.url);
const DEFAULT_LOCALE$2 = "en-US";
const BUILT_IN_PREFIX = "_";
const ARG_PREFIX = "arg";
const BUILT_IN_KEY_SEPARATOR = ":";
const ANONYMOUS_COMMAND_NAME = "(anonymous)";
const NOOP = () => {};
const COMMON_ARGS = {
	help: {
		type: "boolean",
		short: "h",
		description: "Display this help message"
	},
	version: {
		type: "boolean",
		short: "v",
		description: "Display this version"
	}
};
const COMMAND_OPTIONS_DEFAULT = {
	name: void 0,
	description: void 0,
	version: void 0,
	cwd: void 0,
	usageSilent: false,
	subCommands: void 0,
	leftMargin: 2,
	middleMargin: 10,
	usageOptionType: false,
	usageOptionValue: true,
	renderHeader: void 0,
	renderUsage: void 0,
	renderValidationErrors: void 0,
	translationAdapterFactory: void 0
};
function isLazyCommand(cmd) {
	return typeof cmd === "function" && "commandName" in cmd && !!cmd.commandName;
}
async function resolveLazyCommand(cmd, name$1, needRunResolving = false) {
	let command;
	if (isLazyCommand(cmd)) {
		command = Object.assign(create(), {
			name: cmd.commandName,
			description: cmd.description,
			args: cmd.args,
			examples: cmd.examples,
			resource: cmd.resource
		});
		if (needRunResolving) {
			const loaded = await cmd();
			if (typeof loaded === "function") command.run = loaded;
			else if (typeof loaded === "object") {
				if (loaded.run == null) throw new TypeError(`'run' is required in command: ${cmd.name || name$1}`);
				command.run = loaded.run;
				command.name = loaded.name;
				command.description = loaded.description;
				command.args = loaded.args;
				command.examples = loaded.examples;
				command.resource = loaded.resource;
			} else throw new TypeError(`Cannot resolve command: ${cmd.name || name$1}`);
		}
	} else command = Object.assign(create(), cmd);
	if (command.name == null && name$1) command.name = name$1;
	return deepFreeze(command);
}
function resolveBuiltInKey(key) {
	return `${BUILT_IN_PREFIX}${BUILT_IN_KEY_SEPARATOR}${key}`;
}
function resolveArgKey(key) {
	return `${ARG_PREFIX}${BUILT_IN_KEY_SEPARATOR}${key}`;
}
async function resolveExamples(ctx, examples) {
	return typeof examples === "string" ? examples : typeof examples === "function" ? await examples(ctx) : "";
}
function mapResourceWithBuiltinKey(resource) {
	return Object.entries(resource).reduce((acc, [key, value]) => {
		acc[resolveBuiltInKey(key)] = value;
		return acc;
	}, create());
}
function create(obj = null) {
	return Object.create(obj);
}
function log$3(...args) {
	console.log(...args);
}
function deepFreeze(obj) {
	if (obj === null || typeof obj !== "object") return obj;
	for (const key of Object.keys(obj)) {
		const value = obj[key];
		if (typeof value === "object" && value !== null) deepFreeze(value);
	}
	return Object.freeze(obj);
}
var en_US_default = {
	COMMAND: "COMMAND",
	COMMANDS: "COMMANDS",
	SUBCOMMAND: "SUBCOMMAND",
	USAGE: "USAGE",
	ARGUMENTS: "ARGUMENTS",
	OPTIONS: "OPTIONS",
	EXAMPLES: "EXAMPLES",
	FORMORE: "For more info, run any command with the `--help` flag:",
	NEGATABLE: "Negatable of",
	DEFAULT: "default",
	CHOICES: "choices",
	help: "Display this help message",
	version: "Display this version"
};
function createTranslationAdapter(options) {
	return new DefaultTranslation(options);
}
var DefaultTranslation = class {
	#resources = /* @__PURE__ */ new Map();
	#options;
	constructor(options) {
		this.#options = options;
		this.#resources.set(options.locale, create());
		if (options.locale !== options.fallbackLocale) this.#resources.set(options.fallbackLocale, create());
	}
	getResource(locale) {
		return this.#resources.get(locale);
	}
	setResource(locale, resource) {
		this.#resources.set(locale, resource);
	}
	getMessage(locale, key) {
		const resource = this.getResource(locale);
		if (resource) return resource[key];
	}
	translate(locale, key, values = create()) {
		let message = this.getMessage(locale, key);
		if (message === void 0 && locale !== this.#options.fallbackLocale) message = this.getMessage(this.#options.fallbackLocale, key);
		if (message === void 0) return;
		return message.replaceAll(/\{\{(\w+)\}\}/g, (_$1, name$1) => {
			return values[name$1] == null ? "" : values[name$1].toString();
		});
	}
};
const BUILT_IN_PREFIX_CODE = BUILT_IN_PREFIX.codePointAt(0);
async function createCommandContext({ args, values, positionals, rest, argv: argv$2, tokens, command, cliOptions, callMode = "entry", omitted = false }) {
	const _args = Object.entries(args).reduce((acc, [key, value]) => {
		acc[key] = Object.assign(create(), value);
		return acc;
	}, create());
	const env$3 = Object.assign(create(), COMMAND_OPTIONS_DEFAULT, cliOptions);
	const locale = resolveLocale(cliOptions.locale);
	const localeStr = locale.toString();
	const adapter = (cliOptions.translationAdapterFactory || createTranslationAdapter)({
		locale: localeStr,
		fallbackLocale: DEFAULT_LOCALE$2
	});
	const localeResources = /* @__PURE__ */ new Map();
	let builtInLoadedResources;
	localeResources.set(DEFAULT_LOCALE$2, mapResourceWithBuiltinKey(en_US_default));
	if (DEFAULT_LOCALE$2 !== localeStr) try {
		builtInLoadedResources = (await import(`./locales/${localeStr}.json`, { with: { type: "json" } })).default;
		localeResources.set(localeStr, mapResourceWithBuiltinKey(builtInLoadedResources));
	} catch {}
	function translate(key, values$1 = create()) {
		const strKey = key;
		if (strKey.codePointAt(0) === BUILT_IN_PREFIX_CODE) return (localeResources.get(localeStr) || localeResources.get(DEFAULT_LOCALE$2))[strKey] || strKey;
		else return adapter.translate(locale.toString(), strKey, values$1) || "";
	}
	let cachedCommands;
	async function loadCommands() {
		if (cachedCommands) return cachedCommands;
		const subCommands$1 = [...cliOptions.subCommands || []];
		return cachedCommands = await Promise.all(subCommands$1.map(async ([name$1, cmd]) => await resolveLazyCommand(cmd, name$1)));
	}
	const ctx = deepFreeze(Object.assign(create(), {
		name: getCommandName(command),
		description: command.description,
		omitted,
		callMode,
		locale,
		env: env$3,
		args: _args,
		values,
		positionals,
		rest,
		_: argv$2,
		tokens,
		toKebab: command.toKebab,
		log: cliOptions.usageSilent ? NOOP : log$3,
		loadCommands,
		translate
	}));
	const defaultCommandResource = Object.entries(args).map(([key, arg]) => {
		return [key, arg.description || ""];
	}).reduce((res, [key, value]) => {
		res[resolveArgKey(key)] = value;
		return res;
	}, create());
	defaultCommandResource.description = command.description || "";
	defaultCommandResource.examples = await resolveExamples(ctx, command.examples);
	adapter.setResource(DEFAULT_LOCALE$2, defaultCommandResource);
	const originalResource = await loadCommandResource(ctx, command);
	if (originalResource) {
		const resource = Object.assign(create(), originalResource, { examples: await resolveExamples(ctx, originalResource.examples) });
		if (builtInLoadedResources) {
			resource.help = builtInLoadedResources.help;
			resource.version = builtInLoadedResources.version;
		}
		adapter.setResource(localeStr, resource);
	}
	return ctx;
}
function getCommandName(cmd) {
	if (isLazyCommand(cmd)) return cmd.commandName || cmd.name || ANONYMOUS_COMMAND_NAME;
	else if (typeof cmd === "object") return cmd.name || ANONYMOUS_COMMAND_NAME;
	else return ANONYMOUS_COMMAND_NAME;
}
function resolveLocale(locale) {
	return locale instanceof Intl.Locale ? locale : typeof locale === "string" ? new Intl.Locale(locale) : new Intl.Locale(DEFAULT_LOCALE$2);
}
async function loadCommandResource(ctx, command) {
	let resource;
	try {
		resource = await command.resource?.(ctx);
	} catch {}
	return resource;
}
function define(definition) {
	return definition;
}
/**
* @author kazuya kawaguchi (a.k.a. kazupon)
* @license MIT
*/
function kebabnize(str) {
	return str.replace(/[A-Z]/g, (match, offset) => (offset > 0 ? "-" : "") + match.toLowerCase());
}
function renderHeader(ctx) {
	const title = ctx.env.description || ctx.env.name || "";
	return Promise.resolve(title ? `${title} (${ctx.env.name || ""}${ctx.env.version ? ` v${ctx.env.version}` : ""})` : title);
}
const COMMON_ARGS_KEYS = Object.keys(COMMON_ARGS);
async function renderUsage(ctx) {
	const messages$1 = [];
	if (!ctx.omitted) {
		const description$1 = resolveDescription(ctx);
		if (description$1) messages$1.push(description$1, "");
	}
	messages$1.push(...await renderUsageSection(ctx), "");
	if (ctx.omitted && await hasCommands(ctx)) messages$1.push(...await renderCommandsSection(ctx), "");
	if (hasPositionalArgs(ctx)) messages$1.push(...await renderPositionalArgsSection(ctx), "");
	if (hasOptionalArgs(ctx)) messages$1.push(...await renderOptionalArgsSection(ctx), "");
	const examples = await renderExamplesSection(ctx);
	if (examples.length > 0) messages$1.push(...examples, "");
	return messages$1.join("\n");
}
async function renderPositionalArgsSection(ctx) {
	const messages$1 = [];
	messages$1.push(`${ctx.translate(resolveBuiltInKey("ARGUMENTS"))}:`);
	messages$1.push(await generatePositionalArgsUsage(ctx));
	return messages$1;
}
async function renderOptionalArgsSection(ctx) {
	const messages$1 = [];
	messages$1.push(`${ctx.translate(resolveBuiltInKey("OPTIONS"))}:`);
	messages$1.push(await generateOptionalArgsUsage(ctx, getOptionalArgsPairs(ctx)));
	return messages$1;
}
async function renderExamplesSection(ctx) {
	const messages$1 = [];
	const resolvedExamples = await resolveExamples$1(ctx);
	if (resolvedExamples) {
		const examples = resolvedExamples.split("\n").map((example) => example.padStart(ctx.env.leftMargin + example.length));
		messages$1.push(`${ctx.translate(resolveBuiltInKey("EXAMPLES"))}:`, ...examples);
	}
	return messages$1;
}
async function renderUsageSection(ctx) {
	const messages$1 = [`${ctx.translate(resolveBuiltInKey("USAGE"))}:`];
	if (ctx.omitted) {
		const defaultCommand = `${resolveEntry(ctx)}${await hasCommands(ctx) ? ` [${resolveSubCommand(ctx)}]` : ""} ${[generateOptionsSymbols(ctx), generatePositionalSymbols(ctx)].filter(Boolean).join(" ")}`;
		messages$1.push(defaultCommand.padStart(ctx.env.leftMargin + defaultCommand.length));
		if (await hasCommands(ctx)) {
			const commandsUsage = `${resolveEntry(ctx)} <${ctx.translate(resolveBuiltInKey("COMMANDS"))}>`;
			messages$1.push(commandsUsage.padStart(ctx.env.leftMargin + commandsUsage.length));
		}
	} else {
		const usageStr = `${resolveEntry(ctx)} ${resolveSubCommand(ctx)} ${[generateOptionsSymbols(ctx), generatePositionalSymbols(ctx)].filter(Boolean).join(" ")}`;
		messages$1.push(usageStr.padStart(ctx.env.leftMargin + usageStr.length));
	}
	return messages$1;
}
async function renderCommandsSection(ctx) {
	const messages$1 = [`${ctx.translate(resolveBuiltInKey("COMMANDS"))}:`];
	const loadedCommands = await ctx.loadCommands();
	const commandMaxLength = Math.max(...loadedCommands.map((cmd) => (cmd.name || "").length));
	const commandsStr = await Promise.all(loadedCommands.map((cmd) => {
		const key = cmd.name || "";
		const desc = cmd.description || "";
		const command = `${key.padEnd(commandMaxLength + ctx.env.middleMargin)}${desc} `;
		return `${command.padStart(ctx.env.leftMargin + command.length)} `;
	}));
	messages$1.push(...commandsStr, "", ctx.translate(resolveBuiltInKey("FORMORE")));
	messages$1.push(...loadedCommands.map((cmd) => {
		const commandHelp = `${ctx.env.name} ${cmd.name} --help`;
		return `${commandHelp.padStart(ctx.env.leftMargin + commandHelp.length)}`;
	}));
	return messages$1;
}
function resolveEntry(ctx) {
	return ctx.env.name || ctx.translate(resolveBuiltInKey("COMMAND"));
}
function resolveSubCommand(ctx) {
	return ctx.name || ctx.translate(resolveBuiltInKey("SUBCOMMAND"));
}
function resolveDescription(ctx) {
	return ctx.translate("description") || ctx.description || "";
}
async function resolveExamples$1(ctx) {
	const ret = ctx.translate("examples");
	if (ret) return ret;
	const command = ctx.env.subCommands?.get(ctx.name || "");
	return await resolveExamples(ctx, command?.examples);
}
async function hasCommands(ctx) {
	return (await ctx.loadCommands()).length > 1;
}
function hasOptionalArgs(ctx) {
	return !!(ctx.args && Object.values(ctx.args).some((arg) => arg.type !== "positional"));
}
function hasPositionalArgs(ctx) {
	return !!(ctx.args && Object.values(ctx.args).some((arg) => arg.type === "positional"));
}
function hasAllDefaultOptions(ctx) {
	return !!(ctx.args && Object.values(ctx.args).every((arg) => arg.default));
}
function generateOptionsSymbols(ctx) {
	return hasOptionalArgs(ctx) ? hasAllDefaultOptions(ctx) ? `[${ctx.translate(resolveBuiltInKey("OPTIONS"))}]` : `<${ctx.translate(resolveBuiltInKey("OPTIONS"))}>` : "";
}
function makeShortLongOptionPair(schema, name$1, toKebab) {
	let key = `--${toKebab || schema.toKebab ? kebabnize(name$1) : name$1}`;
	if (schema.short) key = `-${schema.short}, ${key}`;
	return key;
}
function getOptionalArgsPairs(ctx) {
	return Object.entries(ctx.args).reduce((acc, [name$1, schema]) => {
		if (schema.type === "positional") return acc;
		let key = makeShortLongOptionPair(schema, name$1, ctx.toKebab);
		if (schema.type !== "boolean") {
			const displayName = ctx.toKebab || schema.toKebab ? kebabnize(name$1) : name$1;
			key = schema.default ? `${key} [${displayName}]` : `${key} <${displayName}>`;
		}
		acc[name$1] = key;
		if (schema.type === "boolean" && schema.negatable && !COMMON_ARGS_KEYS.includes(name$1)) {
			const displayName = ctx.toKebab || schema.toKebab ? kebabnize(name$1) : name$1;
			acc[`no-${name$1}`] = `--no-${displayName}`;
		}
		return acc;
	}, create());
}
const resolveNegatableKey = (key) => key.split("no-")[1];
function resolveNegatableType(key, ctx) {
	return ctx.args[key.startsWith("no-") ? resolveNegatableKey(key) : key].type;
}
function generateDefaultDisplayValue(ctx, schema) {
	return `${ctx.translate(resolveBuiltInKey("DEFAULT"))}: ${schema.default}`;
}
function resolveDisplayValue(ctx, key) {
	if (COMMON_ARGS_KEYS.includes(key)) return "";
	const schema = ctx.args[key];
	if ((schema.type === "boolean" || schema.type === "number" || schema.type === "string" || schema.type === "custom") && schema.default !== void 0) return `(${generateDefaultDisplayValue(ctx, schema)})`;
	if (schema.type === "enum") {
		const _default = schema.default !== void 0 ? generateDefaultDisplayValue(ctx, schema) : "";
		const choices = `${ctx.translate(resolveBuiltInKey("CHOICES"))}: ${schema.choices.join(" | ")}`;
		return `(${_default ? `${_default}, ${choices}` : choices})`;
	}
	return "";
}
async function generateOptionalArgsUsage(ctx, optionsPairs) {
	const optionsMaxLength = Math.max(...Object.entries(optionsPairs).map(([_$1, value]) => value.length));
	const optionSchemaMaxLength = ctx.env.usageOptionType ? Math.max(...Object.entries(optionsPairs).map(([key]) => resolveNegatableType(key, ctx).length)) : 0;
	return (await Promise.all(Object.entries(optionsPairs).map(([key, value]) => {
		let rawDesc = ctx.translate(resolveArgKey(key));
		if (!rawDesc && key.startsWith("no-")) {
			const name$1 = resolveNegatableKey(key);
			const schema = ctx.args[name$1];
			const optionKey = makeShortLongOptionPair(schema, name$1, ctx.toKebab);
			rawDesc = `${ctx.translate(resolveBuiltInKey("NEGATABLE"))} ${optionKey}`;
		}
		const optionsSchema = ctx.env.usageOptionType ? `[${resolveNegatableType(key, ctx)}] ` : "";
		const valueDesc = key.startsWith("no-") ? "" : resolveDisplayValue(ctx, key);
		const desc = `${optionsSchema ? optionsSchema.padEnd(optionSchemaMaxLength + 3) : ""}${rawDesc}`;
		const option = `${value.padEnd(optionsMaxLength + ctx.env.middleMargin)}${desc}${valueDesc ? ` ${valueDesc}` : ""}`;
		return `${option.padStart(ctx.env.leftMargin + option.length)}`;
	}))).join("\n");
}
function getPositionalArgs(ctx) {
	return Object.entries(ctx.args).filter(([_$1, schema]) => schema.type === "positional");
}
async function generatePositionalArgsUsage(ctx) {
	const positionals = getPositionalArgs(ctx);
	const argsMaxLength = Math.max(...positionals.map(([name$1]) => name$1.length));
	return (await Promise.all(positionals.map(([name$1]) => {
		const desc = ctx.translate(resolveArgKey(name$1)) || ctx.args[name$1].description || "";
		const arg = `${name$1.padEnd(argsMaxLength + ctx.env.middleMargin)} ${desc}`;
		return `${arg.padStart(ctx.env.leftMargin + arg.length)}`;
	}))).join("\n");
}
function generatePositionalSymbols(ctx) {
	return hasPositionalArgs(ctx) ? getPositionalArgs(ctx).map(([name$1]) => `<${name$1}>`).join(" ") : "";
}
function renderValidationErrors(_ctx, error) {
	const messages$1 = [];
	for (const err of error.errors) messages$1.push(err.message);
	return Promise.resolve(messages$1.join("\n"));
}
const HYPHEN_CHAR = "-";
const HYPHEN_CODE = HYPHEN_CHAR.codePointAt(0);
const EQUAL_CHAR = "=";
const EQUAL_CODE = EQUAL_CHAR.codePointAt(0);
const TERMINATOR = "--";
const SHORT_OPTION_PREFIX = HYPHEN_CHAR;
const LONG_OPTION_PREFIX = "--";
function parseArgs(args, options = {}) {
	const { allowCompatible = false } = options;
	const tokens = [];
	const remainings = [...args];
	let index = -1;
	let groupCount = 0;
	let hasShortValueSeparator = false;
	while (remainings.length > 0) {
		const arg = remainings.shift();
		if (arg == void 0) break;
		const nextArg = remainings[0];
		if (groupCount > 0) groupCount--;
		else index++;
		if (arg === TERMINATOR) {
			tokens.push({
				kind: "option-terminator",
				index
			});
			const mapped = remainings.map((arg$1) => {
				return {
					kind: "positional",
					index: ++index,
					value: arg$1
				};
			});
			tokens.push(...mapped);
			break;
		}
		if (isShortOption(arg)) {
			const shortOption = arg.charAt(1);
			let value;
			let inlineValue;
			if (groupCount) {
				tokens.push({
					kind: "option",
					name: shortOption,
					rawName: arg,
					index,
					value,
					inlineValue
				});
				if (groupCount === 1 && hasOptionValue(nextArg)) {
					value = remainings.shift();
					if (hasShortValueSeparator) {
						inlineValue = true;
						hasShortValueSeparator = false;
					}
					tokens.push({
						kind: "option",
						index,
						value,
						inlineValue
					});
				}
			} else tokens.push({
				kind: "option",
				name: shortOption,
				rawName: arg,
				index,
				value,
				inlineValue
			});
			if (value != null) ++index;
			continue;
		}
		if (isShortOptionGroup(arg)) {
			const expanded = [];
			let shortValue = "";
			for (let i$1 = 1; i$1 < arg.length; i$1++) {
				const shortableOption = arg.charAt(i$1);
				if (hasShortValueSeparator) shortValue += shortableOption;
				else if (!allowCompatible && shortableOption.codePointAt(0) === EQUAL_CODE) hasShortValueSeparator = true;
				else expanded.push(`${SHORT_OPTION_PREFIX}${shortableOption}`);
			}
			if (shortValue) expanded.push(shortValue);
			remainings.unshift(...expanded);
			groupCount = expanded.length;
			continue;
		}
		if (isLongOption(arg)) {
			const longOption = arg.slice(2);
			tokens.push({
				kind: "option",
				name: longOption,
				rawName: arg,
				index,
				value: void 0,
				inlineValue: void 0
			});
			continue;
		}
		if (isLongOptionAndValue(arg)) {
			const equalIndex = arg.indexOf(EQUAL_CHAR);
			const longOption = arg.slice(2, equalIndex);
			const value = arg.slice(equalIndex + 1);
			tokens.push({
				kind: "option",
				name: longOption,
				rawName: `${LONG_OPTION_PREFIX}${longOption}`,
				index,
				value,
				inlineValue: true
			});
			continue;
		}
		tokens.push({
			kind: "positional",
			index,
			value: arg
		});
	}
	return tokens;
}
function isShortOption(arg) {
	return arg.length === 2 && arg.codePointAt(0) === HYPHEN_CODE && arg.codePointAt(1) !== HYPHEN_CODE;
}
function isShortOptionGroup(arg) {
	if (arg.length <= 2) return false;
	if (arg.codePointAt(0) !== HYPHEN_CODE) return false;
	if (arg.codePointAt(1) === HYPHEN_CODE) return false;
	return true;
}
function isLongOption(arg) {
	return hasLongOptionPrefix(arg) && !arg.includes(EQUAL_CHAR, 3);
}
function isLongOptionAndValue(arg) {
	return hasLongOptionPrefix(arg) && arg.includes(EQUAL_CHAR, 3);
}
function hasLongOptionPrefix(arg) {
	return arg.length > 2 && ~arg.indexOf(LONG_OPTION_PREFIX);
}
function hasOptionValue(value) {
	return !(value == null) && value.codePointAt(0) !== HYPHEN_CODE;
}
const SKIP_POSITIONAL_DEFAULT = -1;
function resolveArgs(args, tokens, { shortGrouping = false, skipPositional = SKIP_POSITIONAL_DEFAULT, toKebab = false } = {}) {
	const skipPositionalIndex = typeof skipPositional === "number" ? Math.max(skipPositional, SKIP_POSITIONAL_DEFAULT) : SKIP_POSITIONAL_DEFAULT;
	const rest = [];
	const optionTokens = [];
	const positionalTokens = [];
	let currentLongOption;
	let currentShortOption;
	const expandableShortOptions = [];
	function toShortValue() {
		if (expandableShortOptions.length === 0) return void 0;
		else {
			const value = expandableShortOptions.map((token) => token.name).join("");
			expandableShortOptions.length = 0;
			return value;
		}
	}
	function applyLongOptionValue(value = void 0) {
		if (currentLongOption) {
			currentLongOption.value = value;
			optionTokens.push({ ...currentLongOption });
			currentLongOption = void 0;
		}
	}
	function applyShortOptionValue(value = void 0) {
		if (currentShortOption) {
			currentShortOption.value = value || toShortValue();
			optionTokens.push({ ...currentShortOption });
			currentShortOption = void 0;
		}
	}
	const schemas = Object.values(args);
	let terminated = false;
	for (let i$1 = 0; i$1 < tokens.length; i$1++) {
		const token = tokens[i$1];
		if (token.kind === "positional") {
			if (terminated && token.value) {
				rest.push(token.value);
				continue;
			}
			if (currentShortOption) {
				if (schemas.find((schema) => schema.short === currentShortOption.name && schema.type === "boolean")) positionalTokens.push({ ...token });
			} else if (currentLongOption) {
				if (args[currentLongOption.name]?.type === "boolean") positionalTokens.push({ ...token });
			} else positionalTokens.push({ ...token });
			applyLongOptionValue(token.value);
			applyShortOptionValue(token.value);
		} else if (token.kind === "option") if (token.rawName) {
			if (hasLongOptionPrefix(token.rawName)) {
				applyLongOptionValue();
				if (token.inlineValue) optionTokens.push({ ...token });
				else currentLongOption = { ...token };
				applyShortOptionValue();
			} else if (isShortOption(token.rawName)) if (currentShortOption) {
				if (currentShortOption.index === token.index) if (shortGrouping) {
					currentShortOption.value = token.value;
					optionTokens.push({ ...currentShortOption });
					currentShortOption = { ...token };
				} else expandableShortOptions.push({ ...token });
				else {
					currentShortOption.value = toShortValue();
					optionTokens.push({ ...currentShortOption });
					currentShortOption = { ...token };
				}
				applyLongOptionValue();
			} else {
				currentShortOption = { ...token };
				applyLongOptionValue();
			}
		} else {
			if (currentShortOption && currentShortOption.index == token.index && token.inlineValue) {
				currentShortOption.value = token.value;
				optionTokens.push({ ...currentShortOption });
				currentShortOption = void 0;
			}
			applyLongOptionValue();
		}
		else {
			if (token.kind === "option-terminator") terminated = true;
			applyLongOptionValue();
			applyShortOptionValue();
		}
	}
	applyLongOptionValue();
	applyShortOptionValue();
	const values = Object.create(null);
	const errors = [];
	function checkTokenName(option, schema, token) {
		return token.name === (schema.type === "boolean" ? schema.negatable && token.name?.startsWith("no-") ? `no-${option}` : option : option);
	}
	const positionalItemCount = tokens.filter((token) => token.kind === "positional").length;
	function getPositionalSkipIndex() {
		return Math.min(skipPositionalIndex, positionalItemCount);
	}
	let positionalsCount = 0;
	for (const [rawArg, schema] of Object.entries(args)) {
		const arg = toKebab || schema.toKebab ? kebabnize(rawArg) : rawArg;
		if (schema.required) {
			if (!optionTokens.find((token) => {
				return schema.short && token.name === schema.short || token.rawName && hasLongOptionPrefix(token.rawName) && token.name === arg;
			})) {
				errors.push(createRequireError(arg, schema));
				continue;
			}
		}
		if (schema.type === "positional") {
			if (skipPositionalIndex > SKIP_POSITIONAL_DEFAULT) while (positionalsCount <= getPositionalSkipIndex()) positionalsCount++;
			const positional = positionalTokens[positionalsCount];
			if (positional != null) values[rawArg] = positional.value;
			else errors.push(createRequireError(arg, schema));
			positionalsCount++;
			continue;
		}
		for (let i$1 = 0; i$1 < optionTokens.length; i$1++) {
			const token = optionTokens[i$1];
			if (checkTokenName(arg, schema, token) && token.rawName != void 0 && hasLongOptionPrefix(token.rawName) || schema.short === token.name && token.rawName != void 0 && isShortOption(token.rawName)) {
				const invalid = validateRequire(token, arg, schema);
				if (invalid) {
					errors.push(invalid);
					continue;
				}
				if (schema.type === "boolean") token.value = void 0;
				const [parsedValue, error] = parse$2(token, arg, schema);
				if (error) errors.push(error);
				else if (schema.multiple) {
					values[rawArg] ||= [];
					values[rawArg].push(parsedValue);
				} else values[rawArg] = parsedValue;
			}
		}
		if (values[rawArg] == null && schema.default != null) values[rawArg] = schema.default;
	}
	return {
		values,
		positionals: positionalTokens.map((token) => token.value),
		rest,
		error: errors.length > 0 ? new AggregateError(errors) : void 0
	};
}
function parse$2(token, option, schema) {
	switch (schema.type) {
		case "string": return typeof token.value === "string" ? [token.value || schema.default, void 0] : [void 0, createTypeError(option, schema)];
		case "boolean": return token.value ? [token.value || schema.default, void 0] : [!(schema.negatable && token.name.startsWith("no-")), void 0];
		case "number":
			if (!isNumeric(token.value)) return [void 0, createTypeError(option, schema)];
			return token.value ? [+token.value, void 0] : [+(schema.default || ""), void 0];
		case "enum":
			if (schema.choices && !schema.choices.includes(token.value)) return [void 0, new ArgResolveError(`Optional argument '--${option}' ${schema.short ? `or '-${schema.short}' ` : ""}should be chosen from '${schema.type}' [${schema.choices.map((c$1) => JSON.stringify(c$1)).join(", ")}] values`, option, "type", schema)];
			return [token.value || schema.default, void 0];
		case "custom":
			if (typeof schema.parse !== "function") throw new TypeError(`argument '${option}' should have a 'parse' function`);
			try {
				return [schema.parse(token.value || String(schema.default || "")), void 0];
			} catch (error) {
				return [void 0, error];
			}
		default: throw new Error(`Unsupported argument type '${schema.type}' for option '${option}'`);
	}
}
function createRequireError(option, schema) {
	return new ArgResolveError(schema.type === "positional" ? `Positional argument '${option}' is required` : `Optional argument '--${option}' ${schema.short ? `or '-${schema.short}' ` : ""}is required`, option, "required", schema);
}
var ArgResolveError = class extends Error {
	name;
	schema;
	type;
	constructor(message, name$1, type, schema) {
		super(message);
		this.name = name$1;
		this.type = type;
		this.schema = schema;
	}
};
function validateRequire(token, option, schema) {
	if (schema.required && schema.type !== "boolean" && !token.value) return createRequireError(option, schema);
}
function isNumeric(str) {
	return str.trim() !== "" && !isNaN(str);
}
function createTypeError(option, schema) {
	return new ArgResolveError(`Optional argument '--${option}' ${schema.short ? `or '-${schema.short}' ` : ""}should be '${schema.type}'`, option, "type", schema);
}
async function cli(argv$2, entry, options = {}) {
	const cliOptions = resolveCliOptions(options, entry);
	const tokens = parseArgs(argv$2);
	const subCommand = getSubCommand(tokens);
	const { commandName: name$1, command, callMode } = await resolveCommand(subCommand, entry, cliOptions);
	if (!command) throw new Error(`Command not found: ${name$1 || ""}`);
	const args = resolveArguments(getCommandArgs(command));
	const { values, positionals, rest, error } = resolveArgs(args, tokens, {
		shortGrouping: true,
		toKebab: command.toKebab,
		skipPositional: cliOptions.subCommands.size > 0 ? 0 : -1
	});
	const ctx = await createCommandContext({
		args,
		values,
		positionals,
		rest,
		argv: argv$2,
		tokens,
		omitted: !subCommand,
		callMode,
		command,
		cliOptions
	});
	if (values.version) {
		showVersion(ctx);
		return;
	}
	const usageBuffer = [];
	const header = await showHeader(ctx);
	if (header) usageBuffer.push(header);
	if (values.help) {
		const usage = await showUsage(ctx);
		if (usage) usageBuffer.push(usage);
		return usageBuffer.join("\n");
	}
	if (error) {
		await showValidationErrors(ctx, error);
		return;
	}
	await executeCommand(command, ctx, name$1 || "");
}
function getCommandArgs(cmd) {
	if (isLazyCommand(cmd)) return cmd.args || create();
	else if (typeof cmd === "object") return cmd.args || create();
	else return create();
}
function resolveArguments(args) {
	return Object.assign(create(), args, COMMON_ARGS);
}
function resolveCliOptions(options, entry) {
	const subCommands$1 = new Map(options.subCommands);
	if (options.subCommands) {
		if (isLazyCommand(entry)) subCommands$1.set(entry.commandName, entry);
		else if (typeof entry === "object" && entry.name) subCommands$1.set(entry.name, entry);
	}
	return Object.assign(create(), COMMAND_OPTIONS_DEFAULT, options, { subCommands: subCommands$1 });
}
function getSubCommand(tokens) {
	const firstToken = tokens[0];
	return firstToken && firstToken.kind === "positional" && firstToken.index === 0 && firstToken.value ? firstToken.value : "";
}
async function showUsage(ctx) {
	if (ctx.env.renderUsage === null) return;
	const usage = await (ctx.env.renderUsage || renderUsage)(ctx);
	if (usage) {
		ctx.log(usage);
		return usage;
	}
}
function showVersion(ctx) {
	ctx.log(ctx.env.version);
}
async function showHeader(ctx) {
	if (ctx.env.renderHeader === null) return;
	const header = await (ctx.env.renderHeader || renderHeader)(ctx);
	if (header) {
		ctx.log(header);
		ctx.log();
		return header;
	}
}
async function showValidationErrors(ctx, error) {
	if (ctx.env.renderValidationErrors === null) return;
	const render = ctx.env.renderValidationErrors || renderValidationErrors;
	ctx.log(await render(ctx, error));
}
const CANNOT_RESOLVE_COMMAND = { callMode: "unexpected" };
async function resolveCommand(sub, entry, options) {
	const omitted = !sub;
	async function doResolveCommand() {
		if (typeof entry === "function") if ("commandName" in entry && entry.commandName) return {
			commandName: entry.commandName,
			command: entry,
			callMode: "entry"
		};
		else return {
			command: { run: entry },
			callMode: "entry"
		};
		else if (typeof entry === "object") return {
			commandName: resolveEntryName(entry),
			command: entry,
			callMode: "entry"
		};
		else return CANNOT_RESOLVE_COMMAND;
	}
	if (omitted || options.subCommands?.size === 0) return doResolveCommand();
	const cmd = options.subCommands?.get(sub);
	if (cmd == null) return {
		commandName: sub,
		callMode: "unexpected"
	};
	if (isLazyCommand(cmd) && cmd.commandName == null) cmd.commandName = sub;
	else if (typeof cmd === "object" && cmd.name == null) cmd.name = sub;
	return {
		commandName: sub,
		command: cmd,
		callMode: "subCommand"
	};
}
function resolveEntryName(entry) {
	return entry.name || ANONYMOUS_COMMAND_NAME;
}
async function executeCommand(cmd, ctx, name$1) {
	const resolved = isLazyCommand(cmd) ? await resolveLazyCommand(cmd, name$1, true) : cmd;
	if (resolved.run == null) throw new Error(`'run' not found on Command \`${name$1}\``);
	await resolved.run(ctx);
}
var name = "@ccusage/codex";
var version = "18.0.10";
var description = "Usage analysis tool for OpenAI Codex sessions";
var require_debug = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	let messages = [];
	let level = 0;
	const debug$3 = (msg, min) => {
		if (level >= min) messages.push(msg);
	};
	debug$3.WARN = 1;
	debug$3.INFO = 2;
	debug$3.DEBUG = 3;
	debug$3.reset = () => {
		messages = [];
	};
	debug$3.setDebugLevel = (v$1) => {
		level = v$1;
	};
	debug$3.warn = (msg) => debug$3(msg, debug$3.WARN);
	debug$3.info = (msg) => debug$3(msg, debug$3.INFO);
	debug$3.debug = (msg) => debug$3(msg, debug$3.DEBUG);
	debug$3.debugMessages = () => messages;
	module.exports = debug$3;
}));
var require_ansi_regex = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = ({ onlyFirst = false } = {}) => {
		const pattern = ["[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)", "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))"].join("|");
		return new RegExp(pattern, onlyFirst ? void 0 : "g");
	};
}));
var require_strip_ansi = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const ansiRegex$3 = require_ansi_regex();
	module.exports = (string$1) => typeof string$1 === "string" ? string$1.replace(ansiRegex$3(), "") : string$1;
}));
var require_is_fullwidth_code_point = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const isFullwidthCodePoint$1 = (codePoint) => {
		if (Number.isNaN(codePoint)) return false;
		if (codePoint >= 4352 && (codePoint <= 4447 || codePoint === 9001 || codePoint === 9002 || 11904 <= codePoint && codePoint <= 12871 && codePoint !== 12351 || 12880 <= codePoint && codePoint <= 19903 || 19968 <= codePoint && codePoint <= 42182 || 43360 <= codePoint && codePoint <= 43388 || 44032 <= codePoint && codePoint <= 55203 || 63744 <= codePoint && codePoint <= 64255 || 65040 <= codePoint && codePoint <= 65049 || 65072 <= codePoint && codePoint <= 65131 || 65281 <= codePoint && codePoint <= 65376 || 65504 <= codePoint && codePoint <= 65510 || 110592 <= codePoint && codePoint <= 110593 || 127488 <= codePoint && codePoint <= 127569 || 131072 <= codePoint && codePoint <= 262141)) return true;
		return false;
	};
	module.exports = isFullwidthCodePoint$1;
	module.exports.default = isFullwidthCodePoint$1;
}));
var require_emoji_regex$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = function() {
		return /\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62(?:\uDB40\uDC65\uDB40\uDC6E\uDB40\uDC67|\uDB40\uDC73\uDB40\uDC63\uDB40\uDC74|\uDB40\uDC77\uDB40\uDC6C\uDB40\uDC73)\uDB40\uDC7F|\uD83D\uDC68(?:\uD83C\uDFFC\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68\uD83C\uDFFB|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFE])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFE\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFD])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFC])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83D\uDC68|(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D[\uDC66\uDC67])|[\u2695\u2696\u2708]\uFE0F|\uD83D[\uDC66\uDC67]|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|(?:\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708])\uFE0F|\uD83C\uDFFB\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C[\uDFFB-\uDFFF])|(?:\uD83E\uDDD1\uD83C\uDFFB\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFC\u200D\uD83E\uDD1D\u200D\uD83D\uDC69)\uD83C\uDFFB|\uD83E\uDDD1(?:\uD83C\uDFFF\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1(?:\uD83C[\uDFFB-\uDFFF])|\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1)|(?:\uD83E\uDDD1\uD83C\uDFFE\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFF\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB-\uDFFE])|(?:\uD83E\uDDD1\uD83C\uDFFC\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFD\u200D\uD83E\uDD1D\u200D\uD83D\uDC69)(?:\uD83C[\uDFFB\uDFFC])|\uD83D\uDC69(?:\uD83C\uDFFE\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFC\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFB\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFC-\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD]))|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|(?:\uD83E\uDDD1\uD83C\uDFFD\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFE\u200D\uD83E\uDD1D\u200D\uD83D\uDC69)(?:\uD83C[\uDFFB-\uDFFD])|\uD83D\uDC69\u200D\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D[\uDC66\uDC67])|(?:\uD83D\uDC41\uFE0F\u200D\uD83D\uDDE8|\uD83D\uDC69(?:\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708]|\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])|(?:(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)\uFE0F|\uD83D\uDC6F|\uD83E[\uDD3C\uDDDE\uDDDF])\u200D[\u2640\u2642]|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD6-\uDDDD])(?:(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]|\u200D[\u2640\u2642])|\uD83C\uDFF4\u200D\u2620)\uFE0F|\uD83D\uDC69\u200D\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|\uD83C\uDFF3\uFE0F\u200D\uD83C\uDF08|\uD83D\uDC15\u200D\uD83E\uDDBA|\uD83D\uDC69\u200D\uD83D\uDC66|\uD83D\uDC69\u200D\uD83D\uDC67|\uD83C\uDDFD\uD83C\uDDF0|\uD83C\uDDF4\uD83C\uDDF2|\uD83C\uDDF6\uD83C\uDDE6|[#\*0-9]\uFE0F\u20E3|\uD83C\uDDE7(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF])|\uD83C\uDDF9(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF])|\uD83C\uDDEA(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA])|\uD83E\uDDD1(?:\uD83C[\uDFFB-\uDFFF])|\uD83C\uDDF7(?:\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC])|\uD83D\uDC69(?:\uD83C[\uDFFB-\uDFFF])|\uD83C\uDDF2(?:\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF])|\uD83C\uDDE6(?:\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF])|\uD83C\uDDF0(?:\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF])|\uD83C\uDDED(?:\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA])|\uD83C\uDDE9(?:\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF])|\uD83C\uDDFE(?:\uD83C[\uDDEA\uDDF9])|\uD83C\uDDEC(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE])|\uD83C\uDDF8(?:\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF])|\uD83C\uDDEB(?:\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7])|\uD83C\uDDF5(?:\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE])|\uD83C\uDDFB(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA])|\uD83C\uDDF3(?:\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF])|\uD83C\uDDE8(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF5\uDDF7\uDDFA-\uDDFF])|\uD83C\uDDF1(?:\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE])|\uD83C\uDDFF(?:\uD83C[\uDDE6\uDDF2\uDDFC])|\uD83C\uDDFC(?:\uD83C[\uDDEB\uDDF8])|\uD83C\uDDFA(?:\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF])|\uD83C\uDDEE(?:\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9])|\uD83C\uDDEF(?:\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5])|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u261D\u270A-\u270D]|\uD83C[\uDF85\uDFC2\uDFC7]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC70\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDCAA\uDD74\uDD7A\uDD90\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC]|\uD83E[\uDD0F\uDD18-\uDD1C\uDD1E\uDD1F\uDD30-\uDD36\uDDB5\uDDB6\uDDBB\uDDD2-\uDDD5])(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u270A\u270B\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55]|\uD83C[\uDC04\uDCCF\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF7C\uDF7E-\uDF93\uDFA0-\uDFCA\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF4\uDFF8-\uDFFF]|\uD83D[\uDC00-\uDC3E\uDC40\uDC42-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDD7A\uDD95\uDD96\uDDA4\uDDFB-\uDE4F\uDE80-\uDEC5\uDECC\uDED0-\uDED2\uDED5\uDEEB\uDEEC\uDEF4-\uDEFA\uDFE0-\uDFEB]|\uD83E[\uDD0D-\uDD3A\uDD3C-\uDD45\uDD47-\uDD71\uDD73-\uDD76\uDD7A-\uDDA2\uDDA5-\uDDAA\uDDAE-\uDDCA\uDDCD-\uDDFF\uDE70-\uDE73\uDE78-\uDE7A\uDE80-\uDE82\uDE90-\uDE95])|(?:[#\*0-9\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23E9-\u23F3\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB-\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u261D\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692-\u2697\u2699\u269B\u269C\u26A0\u26A1\u26AA\u26AB\u26B0\u26B1\u26BD\u26BE\u26C4\u26C5\u26C8\u26CE\u26CF\u26D1\u26D3\u26D4\u26E9\u26EA\u26F0-\u26F5\u26F7-\u26FA\u26FD\u2702\u2705\u2708-\u270D\u270F\u2712\u2714\u2716\u271D\u2721\u2728\u2733\u2734\u2744\u2747\u274C\u274E\u2753-\u2755\u2757\u2763\u2764\u2795-\u2797\u27A1\u27B0\u27BF\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B50\u2B55\u3030\u303D\u3297\u3299]|\uD83C[\uDC04\uDCCF\uDD70\uDD71\uDD7E\uDD7F\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE02\uDE1A\uDE2F\uDE32-\uDE3A\uDE50\uDE51\uDF00-\uDF21\uDF24-\uDF93\uDF96\uDF97\uDF99-\uDF9B\uDF9E-\uDFF0\uDFF3-\uDFF5\uDFF7-\uDFFF]|\uD83D[\uDC00-\uDCFD\uDCFF-\uDD3D\uDD49-\uDD4E\uDD50-\uDD67\uDD6F\uDD70\uDD73-\uDD7A\uDD87\uDD8A-\uDD8D\uDD90\uDD95\uDD96\uDDA4\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA-\uDE4F\uDE80-\uDEC5\uDECB-\uDED2\uDED5\uDEE0-\uDEE5\uDEE9\uDEEB\uDEEC\uDEF0\uDEF3-\uDEFA\uDFE0-\uDFEB]|\uD83E[\uDD0D-\uDD3A\uDD3C-\uDD45\uDD47-\uDD71\uDD73-\uDD76\uDD7A-\uDDA2\uDDA5-\uDDAA\uDDAE-\uDDCA\uDDCD-\uDDFF\uDE70-\uDE73\uDE78-\uDE7A\uDE80-\uDE82\uDE90-\uDE95])\uFE0F|(?:[\u261D\u26F9\u270A-\u270D]|\uD83C[\uDF85\uDFC2-\uDFC4\uDFC7\uDFCA-\uDFCC]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66-\uDC78\uDC7C\uDC81-\uDC83\uDC85-\uDC87\uDC8F\uDC91\uDCAA\uDD74\uDD75\uDD7A\uDD90\uDD95\uDD96\uDE45-\uDE47\uDE4B-\uDE4F\uDEA3\uDEB4-\uDEB6\uDEC0\uDECC]|\uD83E[\uDD0F\uDD18-\uDD1F\uDD26\uDD30-\uDD39\uDD3C-\uDD3E\uDDB5\uDDB6\uDDB8\uDDB9\uDDBB\uDDCD-\uDDCF\uDDD1-\uDDDD])/g;
	};
}));
var require_string_width = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const stripAnsi$3 = require_strip_ansi();
	const isFullwidthCodePoint = require_is_fullwidth_code_point();
	const emojiRegex$2 = require_emoji_regex$1();
	const stringWidth$4 = (string$1) => {
		if (typeof string$1 !== "string" || string$1.length === 0) return 0;
		string$1 = stripAnsi$3(string$1);
		if (string$1.length === 0) return 0;
		string$1 = string$1.replace(emojiRegex$2(), "  ");
		let width = 0;
		for (let i$1 = 0; i$1 < string$1.length; i$1++) {
			const code = string$1.codePointAt(i$1);
			if (code <= 31 || code >= 127 && code <= 159) continue;
			if (code >= 768 && code <= 879) continue;
			if (code > 65535) i$1++;
			width += isFullwidthCodePoint(code) ? 2 : 1;
		}
		return width;
	};
	module.exports = stringWidth$4;
	module.exports.default = stringWidth$4;
}));
var require_utils$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const stringWidth$3 = require_string_width();
	function codeRegex(capture) {
		return capture ? /\u001b\[((?:\d*;){0,5}\d*)m/g : /\u001b\[(?:\d*;){0,5}\d*m/g;
	}
	function strlen(str) {
		let code = codeRegex();
		return ("" + str).replace(code, "").split("\n").reduce(function(memo, s$1) {
			return stringWidth$3(s$1) > memo ? stringWidth$3(s$1) : memo;
		}, 0);
	}
	function repeat(str, times) {
		return Array(times + 1).join(str);
	}
	function pad(str, len, pad$1, dir) {
		let length = strlen(str);
		if (len + 1 >= length) {
			let padlen = len - length;
			switch (dir) {
				case "right":
					str = repeat(pad$1, padlen) + str;
					break;
				case "center": {
					let right = Math.ceil(padlen / 2);
					str = repeat(pad$1, padlen - right) + str + repeat(pad$1, right);
					break;
				}
				default:
					str = str + repeat(pad$1, padlen);
					break;
			}
		}
		return str;
	}
	let codeCache = {};
	function addToCodeCache(name$1, on, off) {
		on = "\x1B[" + on + "m";
		off = "\x1B[" + off + "m";
		codeCache[on] = {
			set: name$1,
			to: true
		};
		codeCache[off] = {
			set: name$1,
			to: false
		};
		codeCache[name$1] = {
			on,
			off
		};
	}
	addToCodeCache("bold", 1, 22);
	addToCodeCache("italics", 3, 23);
	addToCodeCache("underline", 4, 24);
	addToCodeCache("inverse", 7, 27);
	addToCodeCache("strikethrough", 9, 29);
	function updateState(state, controlChars) {
		let controlCode = controlChars[1] ? parseInt(controlChars[1].split(";")[0]) : 0;
		if (controlCode >= 30 && controlCode <= 39 || controlCode >= 90 && controlCode <= 97) {
			state.lastForegroundAdded = controlChars[0];
			return;
		}
		if (controlCode >= 40 && controlCode <= 49 || controlCode >= 100 && controlCode <= 107) {
			state.lastBackgroundAdded = controlChars[0];
			return;
		}
		if (controlCode === 0) {
			for (let i$1 in state)
 /* istanbul ignore else */
			if (Object.prototype.hasOwnProperty.call(state, i$1)) delete state[i$1];
			return;
		}
		let info$1 = codeCache[controlChars[0]];
		if (info$1) state[info$1.set] = info$1.to;
	}
	function readState(line) {
		let code = codeRegex(true);
		let controlChars = code.exec(line);
		let state = {};
		while (controlChars !== null) {
			updateState(state, controlChars);
			controlChars = code.exec(line);
		}
		return state;
	}
	function unwindState(state, ret) {
		let lastBackgroundAdded = state.lastBackgroundAdded;
		let lastForegroundAdded = state.lastForegroundAdded;
		delete state.lastBackgroundAdded;
		delete state.lastForegroundAdded;
		Object.keys(state).forEach(function(key) {
			if (state[key]) ret += codeCache[key].off;
		});
		if (lastBackgroundAdded && lastBackgroundAdded != "\x1B[49m") ret += "\x1B[49m";
		if (lastForegroundAdded && lastForegroundAdded != "\x1B[39m") ret += "\x1B[39m";
		return ret;
	}
	function rewindState(state, ret) {
		let lastBackgroundAdded = state.lastBackgroundAdded;
		let lastForegroundAdded = state.lastForegroundAdded;
		delete state.lastBackgroundAdded;
		delete state.lastForegroundAdded;
		Object.keys(state).forEach(function(key) {
			if (state[key]) ret = codeCache[key].on + ret;
		});
		if (lastBackgroundAdded && lastBackgroundAdded != "\x1B[49m") ret = lastBackgroundAdded + ret;
		if (lastForegroundAdded && lastForegroundAdded != "\x1B[39m") ret = lastForegroundAdded + ret;
		return ret;
	}
	function truncateWidth(str, desiredLength) {
		if (str.length === strlen(str)) return str.substr(0, desiredLength);
		while (strlen(str) > desiredLength) str = str.slice(0, -1);
		return str;
	}
	function truncateWidthWithAnsi(str, desiredLength) {
		let code = codeRegex(true);
		let split = str.split(codeRegex());
		let splitIndex = 0;
		let retLen = 0;
		let ret = "";
		let myArray;
		let state = {};
		while (retLen < desiredLength) {
			myArray = code.exec(str);
			let toAdd = split[splitIndex];
			splitIndex++;
			if (retLen + strlen(toAdd) > desiredLength) toAdd = truncateWidth(toAdd, desiredLength - retLen);
			ret += toAdd;
			retLen += strlen(toAdd);
			if (retLen < desiredLength) {
				if (!myArray) break;
				ret += myArray[0];
				updateState(state, myArray);
			}
		}
		return unwindState(state, ret);
	}
	function truncate(str, desiredLength, truncateChar) {
		truncateChar = truncateChar || "…";
		if (strlen(str) <= desiredLength) return str;
		desiredLength -= strlen(truncateChar);
		let ret = truncateWidthWithAnsi(str, desiredLength);
		ret += truncateChar;
		const hrefTag = "\x1B]8;;\x07";
		if (str.includes(hrefTag) && !ret.includes(hrefTag)) ret += hrefTag;
		return ret;
	}
	function defaultOptions() {
		return {
			chars: {
				top: "─",
				"top-mid": "┬",
				"top-left": "┌",
				"top-right": "┐",
				bottom: "─",
				"bottom-mid": "┴",
				"bottom-left": "└",
				"bottom-right": "┘",
				left: "│",
				"left-mid": "├",
				mid: "─",
				"mid-mid": "┼",
				right: "│",
				"right-mid": "┤",
				middle: "│"
			},
			truncate: "…",
			colWidths: [],
			rowHeights: [],
			colAligns: [],
			rowAligns: [],
			style: {
				"padding-left": 1,
				"padding-right": 1,
				head: ["red"],
				border: ["grey"],
				compact: false
			},
			head: []
		};
	}
	function mergeOptions(options, defaults) {
		options = options || {};
		defaults = defaults || defaultOptions();
		let ret = Object.assign({}, defaults, options);
		ret.chars = Object.assign({}, defaults.chars, options.chars);
		ret.style = Object.assign({}, defaults.style, options.style);
		return ret;
	}
	function wordWrap(maxLength, input) {
		let lines = [];
		let split = input.split(/(\s+)/g);
		let line = [];
		let lineLength = 0;
		let whitespace;
		for (let i$1 = 0; i$1 < split.length; i$1 += 2) {
			let word = split[i$1];
			let newLength = lineLength + strlen(word);
			if (lineLength > 0 && whitespace) newLength += whitespace.length;
			if (newLength > maxLength) {
				if (lineLength !== 0) lines.push(line.join(""));
				line = [word];
				lineLength = strlen(word);
			} else {
				line.push(whitespace || "", word);
				lineLength = newLength;
			}
			whitespace = split[i$1 + 1];
		}
		if (lineLength) lines.push(line.join(""));
		return lines;
	}
	function textWrap(maxLength, input) {
		let lines = [];
		let line = "";
		function pushLine(str, ws) {
			if (line.length && ws) line += ws;
			line += str;
			while (line.length > maxLength) {
				lines.push(line.slice(0, maxLength));
				line = line.slice(maxLength);
			}
		}
		let split = input.split(/(\s+)/g);
		for (let i$1 = 0; i$1 < split.length; i$1 += 2) pushLine(split[i$1], i$1 && split[i$1 - 1]);
		if (line.length) lines.push(line);
		return lines;
	}
	function multiLineWordWrap(maxLength, input, wrapOnWordBoundary = true) {
		let output = [];
		input = input.split("\n");
		const handler = wrapOnWordBoundary ? wordWrap : textWrap;
		for (let i$1 = 0; i$1 < input.length; i$1++) output.push.apply(output, handler(maxLength, input[i$1]));
		return output;
	}
	function colorizeLines(input) {
		let state = {};
		let output = [];
		for (let i$1 = 0; i$1 < input.length; i$1++) {
			let line = rewindState(state, input[i$1]);
			state = readState(line);
			let temp = Object.assign({}, state);
			output.push(unwindState(temp, line));
		}
		return output;
	}
	function hyperlink(url, text) {
		const OSC = "\x1B]";
		const BEL = "\x07";
		const SEP = ";";
		return [
			OSC,
			"8",
			SEP,
			SEP,
			url || text,
			BEL,
			text,
			OSC,
			"8",
			SEP,
			SEP,
			BEL
		].join("");
	}
	module.exports = {
		strlen,
		repeat,
		pad,
		truncate,
		mergeOptions,
		wordWrap: multiLineWordWrap,
		colorizeLines,
		hyperlink
	};
}));
var require_styles = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var styles$1 = {};
	module["exports"] = styles$1;
	var codes = {
		reset: [0, 0],
		bold: [1, 22],
		dim: [2, 22],
		italic: [3, 23],
		underline: [4, 24],
		inverse: [7, 27],
		hidden: [8, 28],
		strikethrough: [9, 29],
		black: [30, 39],
		red: [31, 39],
		green: [32, 39],
		yellow: [33, 39],
		blue: [34, 39],
		magenta: [35, 39],
		cyan: [36, 39],
		white: [37, 39],
		gray: [90, 39],
		grey: [90, 39],
		brightRed: [91, 39],
		brightGreen: [92, 39],
		brightYellow: [93, 39],
		brightBlue: [94, 39],
		brightMagenta: [95, 39],
		brightCyan: [96, 39],
		brightWhite: [97, 39],
		bgBlack: [40, 49],
		bgRed: [41, 49],
		bgGreen: [42, 49],
		bgYellow: [43, 49],
		bgBlue: [44, 49],
		bgMagenta: [45, 49],
		bgCyan: [46, 49],
		bgWhite: [47, 49],
		bgGray: [100, 49],
		bgGrey: [100, 49],
		bgBrightRed: [101, 49],
		bgBrightGreen: [102, 49],
		bgBrightYellow: [103, 49],
		bgBrightBlue: [104, 49],
		bgBrightMagenta: [105, 49],
		bgBrightCyan: [106, 49],
		bgBrightWhite: [107, 49],
		blackBG: [40, 49],
		redBG: [41, 49],
		greenBG: [42, 49],
		yellowBG: [43, 49],
		blueBG: [44, 49],
		magentaBG: [45, 49],
		cyanBG: [46, 49],
		whiteBG: [47, 49]
	};
	Object.keys(codes).forEach(function(key) {
		var val = codes[key];
		var style = styles$1[key] = [];
		style.open = "\x1B[" + val[0] + "m";
		style.close = "\x1B[" + val[1] + "m";
	});
}));
var require_has_flag = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = function(flag, argv$2) {
		argv$2 = argv$2 || process.argv;
		var terminatorPos = argv$2.indexOf("--");
		var prefix = /^-{1,2}/.test(flag) ? "" : "--";
		var pos = argv$2.indexOf(prefix + flag);
		return pos !== -1 && (terminatorPos === -1 ? true : pos < terminatorPos);
	};
}));
var require_supports_colors = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var os$1 = __require$1("node:os");
	var hasFlag = require_has_flag();
	var env$2 = process.env;
	var forceColor = void 0;
	if (hasFlag("no-color") || hasFlag("no-colors") || hasFlag("color=false")) forceColor = false;
	else if (hasFlag("color") || hasFlag("colors") || hasFlag("color=true") || hasFlag("color=always")) forceColor = true;
	if ("FORCE_COLOR" in env$2) forceColor = env$2.FORCE_COLOR.length === 0 || parseInt(env$2.FORCE_COLOR, 10) !== 0;
	function translateLevel(level$1) {
		if (level$1 === 0) return false;
		return {
			level: level$1,
			hasBasic: true,
			has256: level$1 >= 2,
			has16m: level$1 >= 3
		};
	}
	function supportsColor(stream) {
		if (forceColor === false) return 0;
		if (hasFlag("color=16m") || hasFlag("color=full") || hasFlag("color=truecolor")) return 3;
		if (hasFlag("color=256")) return 2;
		if (stream && !stream.isTTY && forceColor !== true) return 0;
		var min = forceColor ? 1 : 0;
		if (process.platform === "win32") {
			var osRelease = os$1.release().split(".");
			if (Number(process.versions.node.split(".")[0]) >= 8 && Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) return Number(osRelease[2]) >= 14931 ? 3 : 2;
			return 1;
		}
		if ("CI" in env$2) {
			if ([
				"TRAVIS",
				"CIRCLECI",
				"APPVEYOR",
				"GITLAB_CI"
			].some(function(sign) {
				return sign in env$2;
			}) || env$2.CI_NAME === "codeship") return 1;
			return min;
		}
		if ("TEAMCITY_VERSION" in env$2) return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env$2.TEAMCITY_VERSION) ? 1 : 0;
		if ("TERM_PROGRAM" in env$2) {
			var version$1 = parseInt((env$2.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
			switch (env$2.TERM_PROGRAM) {
				case "iTerm.app": return version$1 >= 3 ? 3 : 2;
				case "Hyper": return 3;
				case "Apple_Terminal": return 2;
			}
		}
		if (/-256(color)?$/i.test(env$2.TERM)) return 2;
		if (/^screen|^xterm|^vt100|^rxvt|color|ansi|cygwin|linux/i.test(env$2.TERM)) return 1;
		if ("COLORTERM" in env$2) return 1;
		if (env$2.TERM === "dumb") return min;
		return min;
	}
	function getSupportLevel(stream) {
		return translateLevel(supportsColor(stream));
	}
	module.exports = {
		supportsColor: getSupportLevel,
		stdout: getSupportLevel(process.stdout),
		stderr: getSupportLevel(process.stderr)
	};
}));
var require_trap = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module["exports"] = function runTheTrap(text, options) {
		var result = "";
		text = text || "Run the trap, drop the bass";
		text = text.split("");
		var trap = {
			a: [
				"@",
				"Ą",
				"Ⱥ",
				"Ʌ",
				"Δ",
				"Λ",
				"Д"
			],
			b: [
				"ß",
				"Ɓ",
				"Ƀ",
				"ɮ",
				"β",
				"฿"
			],
			c: [
				"©",
				"Ȼ",
				"Ͼ"
			],
			d: [
				"Ð",
				"Ɗ",
				"Ԁ",
				"ԁ",
				"Ԃ",
				"ԃ"
			],
			e: [
				"Ë",
				"ĕ",
				"Ǝ",
				"ɘ",
				"Σ",
				"ξ",
				"Ҽ",
				"੬"
			],
			f: ["Ӻ"],
			g: ["ɢ"],
			h: [
				"Ħ",
				"ƕ",
				"Ң",
				"Һ",
				"Ӈ",
				"Ԋ"
			],
			i: ["༏"],
			j: ["Ĵ"],
			k: [
				"ĸ",
				"Ҡ",
				"Ӄ",
				"Ԟ"
			],
			l: ["Ĺ"],
			m: [
				"ʍ",
				"Ӎ",
				"ӎ",
				"Ԡ",
				"ԡ",
				"൩"
			],
			n: [
				"Ñ",
				"ŋ",
				"Ɲ",
				"Ͷ",
				"Π",
				"Ҋ"
			],
			o: [
				"Ø",
				"õ",
				"ø",
				"Ǿ",
				"ʘ",
				"Ѻ",
				"ם",
				"۝",
				"๏"
			],
			p: ["Ƿ", "Ҏ"],
			q: ["্"],
			r: [
				"®",
				"Ʀ",
				"Ȑ",
				"Ɍ",
				"ʀ",
				"Я"
			],
			s: [
				"§",
				"Ϟ",
				"ϟ",
				"Ϩ"
			],
			t: [
				"Ł",
				"Ŧ",
				"ͳ"
			],
			u: ["Ʊ", "Ս"],
			v: ["ט"],
			w: [
				"Ш",
				"Ѡ",
				"Ѽ",
				"൰"
			],
			x: [
				"Ҳ",
				"Ӿ",
				"Ӽ",
				"ӽ"
			],
			y: [
				"¥",
				"Ұ",
				"Ӌ"
			],
			z: ["Ƶ", "ɀ"]
		};
		text.forEach(function(c$1) {
			c$1 = c$1.toLowerCase();
			var chars = trap[c$1] || [" "];
			var rand = Math.floor(Math.random() * chars.length);
			if (typeof trap[c$1] !== "undefined") result += trap[c$1][rand];
			else result += c$1;
		});
		return result;
	};
}));
var require_zalgo = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module["exports"] = function zalgo(text, options) {
		text = text || "   he is here   ";
		var soul = {
			"up": [
				"̍",
				"̎",
				"̄",
				"̅",
				"̿",
				"̑",
				"̆",
				"̐",
				"͒",
				"͗",
				"͑",
				"̇",
				"̈",
				"̊",
				"͂",
				"̓",
				"̈",
				"͊",
				"͋",
				"͌",
				"̃",
				"̂",
				"̌",
				"͐",
				"̀",
				"́",
				"̋",
				"̏",
				"̒",
				"̓",
				"̔",
				"̽",
				"̉",
				"ͣ",
				"ͤ",
				"ͥ",
				"ͦ",
				"ͧ",
				"ͨ",
				"ͩ",
				"ͪ",
				"ͫ",
				"ͬ",
				"ͭ",
				"ͮ",
				"ͯ",
				"̾",
				"͛",
				"͆",
				"̚"
			],
			"down": [
				"̖",
				"̗",
				"̘",
				"̙",
				"̜",
				"̝",
				"̞",
				"̟",
				"̠",
				"̤",
				"̥",
				"̦",
				"̩",
				"̪",
				"̫",
				"̬",
				"̭",
				"̮",
				"̯",
				"̰",
				"̱",
				"̲",
				"̳",
				"̹",
				"̺",
				"̻",
				"̼",
				"ͅ",
				"͇",
				"͈",
				"͉",
				"͍",
				"͎",
				"͓",
				"͔",
				"͕",
				"͖",
				"͙",
				"͚",
				"̣"
			],
			"mid": [
				"̕",
				"̛",
				"̀",
				"́",
				"͘",
				"̡",
				"̢",
				"̧",
				"̨",
				"̴",
				"̵",
				"̶",
				"͜",
				"͝",
				"͞",
				"͟",
				"͠",
				"͢",
				"̸",
				"̷",
				"͡",
				" ҉"
			]
		};
		var all = [].concat(soul.up, soul.down, soul.mid);
		function randomNumber(range) {
			return Math.floor(Math.random() * range);
		}
		function isChar(character) {
			var bool = false;
			all.filter(function(i$1) {
				bool = i$1 === character;
			});
			return bool;
		}
		function heComes(text$1, options$1) {
			var result = "";
			var counts;
			var l$2;
			options$1 = options$1 || {};
			options$1["up"] = typeof options$1["up"] !== "undefined" ? options$1["up"] : true;
			options$1["mid"] = typeof options$1["mid"] !== "undefined" ? options$1["mid"] : true;
			options$1["down"] = typeof options$1["down"] !== "undefined" ? options$1["down"] : true;
			options$1["size"] = typeof options$1["size"] !== "undefined" ? options$1["size"] : "maxi";
			text$1 = text$1.split("");
			for (l$2 in text$1) {
				if (isChar(l$2)) continue;
				result = result + text$1[l$2];
				counts = {
					"up": 0,
					"down": 0,
					"mid": 0
				};
				switch (options$1.size) {
					case "mini":
						counts.up = randomNumber(8);
						counts.mid = randomNumber(2);
						counts.down = randomNumber(8);
						break;
					case "maxi":
						counts.up = randomNumber(16) + 3;
						counts.mid = randomNumber(4) + 1;
						counts.down = randomNumber(64) + 3;
						break;
					default:
						counts.up = randomNumber(8) + 1;
						counts.mid = randomNumber(6) / 2;
						counts.down = randomNumber(8) + 1;
						break;
				}
				var arr = [
					"up",
					"mid",
					"down"
				];
				for (var d$1 in arr) {
					var index = arr[d$1];
					for (var i$1 = 0; i$1 <= counts[index]; i$1++) if (options$1[index]) result = result + soul[index][randomNumber(soul[index].length)];
				}
			}
			return result;
		}
		return heComes(text, options);
	};
}));
var require_america = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module["exports"] = function(colors$3) {
		return function(letter, i$1, exploded) {
			if (letter === " ") return letter;
			switch (i$1 % 3) {
				case 0: return colors$3.red(letter);
				case 1: return colors$3.white(letter);
				case 2: return colors$3.blue(letter);
			}
		};
	};
}));
var require_zebra = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module["exports"] = function(colors$3) {
		return function(letter, i$1, exploded) {
			return i$1 % 2 === 0 ? letter : colors$3.inverse(letter);
		};
	};
}));
var require_rainbow = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module["exports"] = function(colors$3) {
		var rainbowColors = [
			"red",
			"yellow",
			"green",
			"blue",
			"magenta"
		];
		return function(letter, i$1, exploded) {
			if (letter === " ") return letter;
			else return colors$3[rainbowColors[i$1++ % rainbowColors.length]](letter);
		};
	};
}));
var require_random = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module["exports"] = function(colors$3) {
		var available = [
			"underline",
			"inverse",
			"grey",
			"yellow",
			"red",
			"green",
			"blue",
			"white",
			"cyan",
			"magenta",
			"brightYellow",
			"brightRed",
			"brightGreen",
			"brightBlue",
			"brightWhite",
			"brightCyan",
			"brightMagenta"
		];
		return function(letter, i$1, exploded) {
			return letter === " " ? letter : colors$3[available[Math.round(Math.random() * (available.length - 2))]](letter);
		};
	};
}));
var require_colors = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var colors$2 = {};
	module["exports"] = colors$2;
	colors$2.themes = {};
	var util = __require$1("node:util");
	var ansiStyles = colors$2.styles = require_styles();
	var defineProps = Object.defineProperties;
	var newLineRegex = /* @__PURE__ */ new RegExp(/[\r\n]+/g);
	colors$2.supportsColor = require_supports_colors().supportsColor;
	if (typeof colors$2.enabled === "undefined") colors$2.enabled = colors$2.supportsColor() !== false;
	colors$2.enable = function() {
		colors$2.enabled = true;
	};
	colors$2.disable = function() {
		colors$2.enabled = false;
	};
	colors$2.stripColors = colors$2.strip = function(str) {
		return ("" + str).replace(/\x1B\[\d+m/g, "");
	};
	colors$2.stylize = function stylize(str, style) {
		if (!colors$2.enabled) return str + "";
		var styleMap = ansiStyles[style];
		if (!styleMap && style in colors$2) return colors$2[style](str);
		return styleMap.open + str + styleMap.close;
	};
	var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;
	var escapeStringRegexp = function(str) {
		if (typeof str !== "string") throw new TypeError("Expected a string");
		return str.replace(matchOperatorsRe, "\\$&");
	};
	function build$8(_styles) {
		var builder = function builder$1() {
			return applyStyle.apply(builder$1, arguments);
		};
		builder._styles = _styles;
		builder.__proto__ = proto;
		return builder;
	}
	var styles = (function() {
		var ret = {};
		ansiStyles.grey = ansiStyles.gray;
		Object.keys(ansiStyles).forEach(function(key) {
			ansiStyles[key].closeRe = new RegExp(escapeStringRegexp(ansiStyles[key].close), "g");
			ret[key] = { get: function() {
				return build$8(this._styles.concat(key));
			} };
		});
		return ret;
	})();
	var proto = defineProps(function colors$3() {}, styles);
	function applyStyle() {
		var str = Array.prototype.slice.call(arguments).map(function(arg) {
			if (arg != null && arg.constructor === String) return arg;
			else return util.inspect(arg);
		}).join(" ");
		if (!colors$2.enabled || !str) return str;
		var newLinesPresent = str.indexOf("\n") != -1;
		var nestedStyles = this._styles;
		var i$1 = nestedStyles.length;
		while (i$1--) {
			var code = ansiStyles[nestedStyles[i$1]];
			str = code.open + str.replace(code.closeRe, code.open) + code.close;
			if (newLinesPresent) str = str.replace(newLineRegex, function(match) {
				return code.close + match + code.open;
			});
		}
		return str;
	}
	colors$2.setTheme = function(theme) {
		if (typeof theme === "string") {
			console.log("colors.setTheme now only accepts an object, not a string.  If you are trying to set a theme from a file, it is now your (the caller's) responsibility to require the file.  The old syntax looked like colors.setTheme(__dirname + '/../themes/generic-logging.js'); The new syntax looks like colors.setTheme(require(__dirname + '/../themes/generic-logging.js'));");
			return;
		}
		for (var style in theme) (function(style$1) {
			colors$2[style$1] = function(str) {
				if (typeof theme[style$1] === "object") {
					var out = str;
					for (var i$1 in theme[style$1]) out = colors$2[theme[style$1][i$1]](out);
					return out;
				}
				return colors$2[theme[style$1]](str);
			};
		})(style);
	};
	function init$1() {
		var ret = {};
		Object.keys(styles).forEach(function(name$1) {
			ret[name$1] = { get: function() {
				return build$8([name$1]);
			} };
		});
		return ret;
	}
	var sequencer = function sequencer$1(map$2, str) {
		var exploded = str.split("");
		exploded = exploded.map(map$2);
		return exploded.join("");
	};
	colors$2.trap = require_trap();
	colors$2.zalgo = require_zalgo();
	colors$2.maps = {};
	colors$2.maps.america = require_america()(colors$2);
	colors$2.maps.zebra = require_zebra()(colors$2);
	colors$2.maps.rainbow = require_rainbow()(colors$2);
	colors$2.maps.random = require_random()(colors$2);
	for (var map$1 in colors$2.maps) (function(map$2) {
		colors$2[map$2] = function(str) {
			return sequencer(colors$2.maps[map$2], str);
		};
	})(map$1);
	defineProps(colors$2, init$1());
}));
var require_safe = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module["exports"] = require_colors();
}));
var require_cell = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { info, debug: debug$2 } = require_debug();
	const utils$5 = require_utils$1();
	var Cell$1 = class Cell$1 {
		constructor(options) {
			this.setOptions(options);
			this.x = null;
			this.y = null;
		}
		setOptions(options) {
			if ([
				"boolean",
				"number",
				"bigint",
				"string"
			].indexOf(typeof options) !== -1) options = { content: "" + options };
			options = options || {};
			this.options = options;
			let content = options.content;
			if ([
				"boolean",
				"number",
				"bigint",
				"string"
			].indexOf(typeof content) !== -1) this.content = String(content);
			else if (!content) this.content = this.options.href || "";
			else throw new Error("Content needs to be a primitive, got: " + typeof content);
			this.colSpan = options.colSpan || 1;
			this.rowSpan = options.rowSpan || 1;
			if (this.options.href) Object.defineProperty(this, "href", { get() {
				return this.options.href;
			} });
		}
		mergeTableOptions(tableOptions, cells) {
			this.cells = cells;
			let optionsChars = this.options.chars || {};
			let tableChars = tableOptions.chars;
			let chars = this.chars = {};
			CHAR_NAMES.forEach(function(name$1) {
				setOption(optionsChars, tableChars, name$1, chars);
			});
			this.truncate = this.options.truncate || tableOptions.truncate;
			let style = this.options.style = this.options.style || {};
			let tableStyle = tableOptions.style;
			setOption(style, tableStyle, "padding-left", this);
			setOption(style, tableStyle, "padding-right", this);
			this.head = style.head || tableStyle.head;
			this.border = style.border || tableStyle.border;
			this.fixedWidth = tableOptions.colWidths[this.x];
			this.lines = this.computeLines(tableOptions);
			this.desiredWidth = utils$5.strlen(this.content) + this.paddingLeft + this.paddingRight;
			this.desiredHeight = this.lines.length;
		}
		computeLines(tableOptions) {
			const tableWordWrap = tableOptions.wordWrap || tableOptions.textWrap;
			const { wordWrap: wordWrap$1 = tableWordWrap } = this.options;
			if (this.fixedWidth && wordWrap$1) {
				this.fixedWidth -= this.paddingLeft + this.paddingRight;
				if (this.colSpan) {
					let i$1 = 1;
					while (i$1 < this.colSpan) {
						this.fixedWidth += tableOptions.colWidths[this.x + i$1];
						i$1++;
					}
				}
				const { wrapOnWordBoundary: tableWrapOnWordBoundary = true } = tableOptions;
				const { wrapOnWordBoundary = tableWrapOnWordBoundary } = this.options;
				return this.wrapLines(utils$5.wordWrap(this.fixedWidth, this.content, wrapOnWordBoundary));
			}
			return this.wrapLines(this.content.split("\n"));
		}
		wrapLines(computedLines) {
			const lines = utils$5.colorizeLines(computedLines);
			if (this.href) return lines.map((line) => utils$5.hyperlink(this.href, line));
			return lines;
		}
		init(tableOptions) {
			let x = this.x;
			let y$2 = this.y;
			this.widths = tableOptions.colWidths.slice(x, x + this.colSpan);
			this.heights = tableOptions.rowHeights.slice(y$2, y$2 + this.rowSpan);
			this.width = this.widths.reduce(sumPlusOne, -1);
			this.height = this.heights.reduce(sumPlusOne, -1);
			this.hAlign = this.options.hAlign || tableOptions.colAligns[x];
			this.vAlign = this.options.vAlign || tableOptions.rowAligns[y$2];
			this.drawRight = x + this.colSpan == tableOptions.colWidths.length;
		}
		draw(lineNum, spanningCell) {
			if (lineNum == "top") return this.drawTop(this.drawRight);
			if (lineNum == "bottom") return this.drawBottom(this.drawRight);
			let content = utils$5.truncate(this.content, 10, this.truncate);
			if (!lineNum) info(`${this.y}-${this.x}: ${this.rowSpan - lineNum}x${this.colSpan} Cell ${content}`);
			let padLen = Math.max(this.height - this.lines.length, 0);
			let padTop;
			switch (this.vAlign) {
				case "center":
					padTop = Math.ceil(padLen / 2);
					break;
				case "bottom":
					padTop = padLen;
					break;
				default: padTop = 0;
			}
			if (lineNum < padTop || lineNum >= padTop + this.lines.length) return this.drawEmpty(this.drawRight, spanningCell);
			let forceTruncation = this.lines.length > this.height && lineNum + 1 >= this.height;
			return this.drawLine(lineNum - padTop, this.drawRight, forceTruncation, spanningCell);
		}
		drawTop(drawRight) {
			let content = [];
			if (this.cells) this.widths.forEach(function(width, index) {
				content.push(this._topLeftChar(index));
				content.push(utils$5.repeat(this.chars[this.y == 0 ? "top" : "mid"], width));
			}, this);
			else {
				content.push(this._topLeftChar(0));
				content.push(utils$5.repeat(this.chars[this.y == 0 ? "top" : "mid"], this.width));
			}
			if (drawRight) content.push(this.chars[this.y == 0 ? "topRight" : "rightMid"]);
			return this.wrapWithStyleColors("border", content.join(""));
		}
		_topLeftChar(offset) {
			let x = this.x + offset;
			let leftChar;
			if (this.y == 0) leftChar = x == 0 ? "topLeft" : offset == 0 ? "topMid" : "top";
			else if (x == 0) leftChar = "leftMid";
			else {
				leftChar = offset == 0 ? "midMid" : "bottomMid";
				if (this.cells) {
					if (this.cells[this.y - 1][x] instanceof Cell$1.ColSpanCell) leftChar = offset == 0 ? "topMid" : "mid";
					if (offset == 0) {
						let i$1 = 1;
						while (this.cells[this.y][x - i$1] instanceof Cell$1.ColSpanCell) i$1++;
						if (this.cells[this.y][x - i$1] instanceof Cell$1.RowSpanCell) leftChar = "leftMid";
					}
				}
			}
			return this.chars[leftChar];
		}
		wrapWithStyleColors(styleProperty, content) {
			if (this[styleProperty] && this[styleProperty].length) try {
				let colors$3 = require_safe();
				for (let i$1 = this[styleProperty].length - 1; i$1 >= 0; i$1--) colors$3 = colors$3[this[styleProperty][i$1]];
				return colors$3(content);
			} catch (e) {
				return content;
			}
			else return content;
		}
		drawLine(lineNum, drawRight, forceTruncationSymbol, spanningCell) {
			let left = this.chars[this.x == 0 ? "left" : "middle"];
			if (this.x && spanningCell && this.cells) {
				let cellLeft = this.cells[this.y + spanningCell][this.x - 1];
				while (cellLeft instanceof ColSpanCell$1) cellLeft = this.cells[cellLeft.y][cellLeft.x - 1];
				if (!(cellLeft instanceof RowSpanCell$1)) left = this.chars["rightMid"];
			}
			let leftPadding = utils$5.repeat(" ", this.paddingLeft);
			let right = drawRight ? this.chars["right"] : "";
			let rightPadding = utils$5.repeat(" ", this.paddingRight);
			let line = this.lines[lineNum];
			let len = this.width - (this.paddingLeft + this.paddingRight);
			if (forceTruncationSymbol) line += this.truncate || "…";
			let content = utils$5.truncate(line, len, this.truncate);
			content = utils$5.pad(content, len, " ", this.hAlign);
			content = leftPadding + content + rightPadding;
			return this.stylizeLine(left, content, right);
		}
		stylizeLine(left, content, right) {
			left = this.wrapWithStyleColors("border", left);
			right = this.wrapWithStyleColors("border", right);
			if (this.y === 0) content = this.wrapWithStyleColors("head", content);
			return left + content + right;
		}
		drawBottom(drawRight) {
			let left = this.chars[this.x == 0 ? "bottomLeft" : "bottomMid"];
			let content = utils$5.repeat(this.chars.bottom, this.width);
			let right = drawRight ? this.chars["bottomRight"] : "";
			return this.wrapWithStyleColors("border", left + content + right);
		}
		drawEmpty(drawRight, spanningCell) {
			let left = this.chars[this.x == 0 ? "left" : "middle"];
			if (this.x && spanningCell && this.cells) {
				let cellLeft = this.cells[this.y + spanningCell][this.x - 1];
				while (cellLeft instanceof ColSpanCell$1) cellLeft = this.cells[cellLeft.y][cellLeft.x - 1];
				if (!(cellLeft instanceof RowSpanCell$1)) left = this.chars["rightMid"];
			}
			let right = drawRight ? this.chars["right"] : "";
			let content = utils$5.repeat(" ", this.width);
			return this.stylizeLine(left, content, right);
		}
	};
	var ColSpanCell$1 = class {
		constructor() {}
		draw(lineNum) {
			if (typeof lineNum === "number") debug$2(`${this.y}-${this.x}: 1x1 ColSpanCell`);
			return "";
		}
		init() {}
		mergeTableOptions() {}
	};
	var RowSpanCell$1 = class {
		constructor(originalCell) {
			this.originalCell = originalCell;
		}
		init(tableOptions) {
			let y$2 = this.y;
			let originalY = this.originalCell.y;
			this.cellOffset = y$2 - originalY;
			this.offset = findDimension(tableOptions.rowHeights, originalY, this.cellOffset);
		}
		draw(lineNum) {
			if (lineNum == "top") return this.originalCell.draw(this.offset, this.cellOffset);
			if (lineNum == "bottom") return this.originalCell.draw("bottom");
			debug$2(`${this.y}-${this.x}: 1x${this.colSpan} RowSpanCell for ${this.originalCell.content}`);
			return this.originalCell.draw(this.offset + 1 + lineNum);
		}
		mergeTableOptions() {}
	};
	function firstDefined(...args) {
		return args.filter((v$1) => v$1 !== void 0 && v$1 !== null).shift();
	}
	function setOption(objA, objB, nameB, targetObj) {
		let nameA = nameB.split("-");
		if (nameA.length > 1) {
			nameA[1] = nameA[1].charAt(0).toUpperCase() + nameA[1].substr(1);
			nameA = nameA.join("");
			targetObj[nameA] = firstDefined(objA[nameA], objA[nameB], objB[nameA], objB[nameB]);
		} else targetObj[nameB] = firstDefined(objA[nameB], objB[nameB]);
	}
	function findDimension(dimensionTable, startingIndex, span) {
		let ret = dimensionTable[startingIndex];
		for (let i$1 = 1; i$1 < span; i$1++) ret += 1 + dimensionTable[startingIndex + i$1];
		return ret;
	}
	function sumPlusOne(a$2, b$2) {
		return a$2 + b$2 + 1;
	}
	let CHAR_NAMES = [
		"top",
		"top-mid",
		"top-left",
		"top-right",
		"bottom",
		"bottom-mid",
		"bottom-left",
		"bottom-right",
		"left",
		"left-mid",
		"mid",
		"mid-mid",
		"right",
		"right-mid",
		"middle"
	];
	module.exports = Cell$1;
	module.exports.ColSpanCell = ColSpanCell$1;
	module.exports.RowSpanCell = RowSpanCell$1;
}));
var require_layout_manager = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { warn, debug: debug$1 } = require_debug();
	const Cell = require_cell();
	const { ColSpanCell, RowSpanCell } = Cell;
	(function() {
		function next(alloc, col) {
			if (alloc[col] > 0) return next(alloc, col + 1);
			return col;
		}
		function layoutTable(table) {
			let alloc = {};
			table.forEach(function(row, rowIndex) {
				let col = 0;
				row.forEach(function(cell) {
					cell.y = rowIndex;
					cell.x = rowIndex ? next(alloc, col) : col;
					const rowSpan = cell.rowSpan || 1;
					const colSpan = cell.colSpan || 1;
					if (rowSpan > 1) for (let cs = 0; cs < colSpan; cs++) alloc[cell.x + cs] = rowSpan;
					col = cell.x + colSpan;
				});
				Object.keys(alloc).forEach((idx) => {
					alloc[idx]--;
					if (alloc[idx] < 1) delete alloc[idx];
				});
			});
		}
		function maxWidth(table) {
			let mw = 0;
			table.forEach(function(row) {
				row.forEach(function(cell) {
					mw = Math.max(mw, cell.x + (cell.colSpan || 1));
				});
			});
			return mw;
		}
		function maxHeight(table) {
			return table.length;
		}
		function cellsConflict(cell1, cell2) {
			let yMin1 = cell1.y;
			let yMax1 = cell1.y - 1 + (cell1.rowSpan || 1);
			let yMin2 = cell2.y;
			let yConflict = !(yMin1 > cell2.y - 1 + (cell2.rowSpan || 1) || yMin2 > yMax1);
			let xMin1 = cell1.x;
			let xMax1 = cell1.x - 1 + (cell1.colSpan || 1);
			let xMin2 = cell2.x;
			let xConflict = !(xMin1 > cell2.x - 1 + (cell2.colSpan || 1) || xMin2 > xMax1);
			return yConflict && xConflict;
		}
		function conflictExists(rows, x, y$2) {
			let i_max = Math.min(rows.length - 1, y$2);
			let cell = {
				x,
				y: y$2
			};
			for (let i$1 = 0; i$1 <= i_max; i$1++) {
				let row = rows[i$1];
				for (let j$1 = 0; j$1 < row.length; j$1++) if (cellsConflict(cell, row[j$1])) return true;
			}
			return false;
		}
		function allBlank(rows, y$2, xMin, xMax) {
			for (let x = xMin; x < xMax; x++) if (conflictExists(rows, x, y$2)) return false;
			return true;
		}
		function addRowSpanCells(table) {
			table.forEach(function(row, rowIndex) {
				row.forEach(function(cell) {
					for (let i$1 = 1; i$1 < cell.rowSpan; i$1++) {
						let rowSpanCell = new RowSpanCell(cell);
						rowSpanCell.x = cell.x;
						rowSpanCell.y = cell.y + i$1;
						rowSpanCell.colSpan = cell.colSpan;
						insertCell(rowSpanCell, table[rowIndex + i$1]);
					}
				});
			});
		}
		function addColSpanCells(cellRows) {
			for (let rowIndex = cellRows.length - 1; rowIndex >= 0; rowIndex--) {
				let cellColumns = cellRows[rowIndex];
				for (let columnIndex = 0; columnIndex < cellColumns.length; columnIndex++) {
					let cell = cellColumns[columnIndex];
					for (let k$1 = 1; k$1 < cell.colSpan; k$1++) {
						let colSpanCell = new ColSpanCell();
						colSpanCell.x = cell.x + k$1;
						colSpanCell.y = cell.y;
						cellColumns.splice(columnIndex + 1, 0, colSpanCell);
					}
				}
			}
		}
		function insertCell(cell, row) {
			let x = 0;
			while (x < row.length && row[x].x < cell.x) x++;
			row.splice(x, 0, cell);
		}
		function fillInTable(table) {
			let h_max = maxHeight(table);
			let w_max = maxWidth(table);
			debug$1(`Max rows: ${h_max}; Max cols: ${w_max}`);
			for (let y$2 = 0; y$2 < h_max; y$2++) for (let x = 0; x < w_max; x++) if (!conflictExists(table, x, y$2)) {
				let opts = {
					x,
					y: y$2,
					colSpan: 1,
					rowSpan: 1
				};
				x++;
				while (x < w_max && !conflictExists(table, x, y$2)) {
					opts.colSpan++;
					x++;
				}
				let y2 = y$2 + 1;
				while (y2 < h_max && allBlank(table, y2, opts.x, opts.x + opts.colSpan)) {
					opts.rowSpan++;
					y2++;
				}
				let cell = new Cell(opts);
				cell.x = opts.x;
				cell.y = opts.y;
				warn(`Missing cell at ${cell.y}-${cell.x}.`);
				insertCell(cell, table[y$2]);
			}
		}
		function generateCells(rows) {
			return rows.map(function(row) {
				if (!Array.isArray(row)) {
					let key = Object.keys(row)[0];
					row = row[key];
					if (Array.isArray(row)) {
						row = row.slice();
						row.unshift(key);
					} else row = [key, row];
				}
				return row.map(function(cell) {
					return new Cell(cell);
				});
			});
		}
		function makeTableLayout(rows) {
			let cellRows = generateCells(rows);
			layoutTable(cellRows);
			fillInTable(cellRows);
			addRowSpanCells(cellRows);
			addColSpanCells(cellRows);
			return cellRows;
		}
		module.exports = {
			makeTableLayout,
			layoutTable,
			addRowSpanCells,
			maxWidth,
			fillInTable,
			computeWidths: makeComputeWidths("colSpan", "desiredWidth", "x", 1),
			computeHeights: makeComputeWidths("rowSpan", "desiredHeight", "y", 1)
		};
	})();
	function makeComputeWidths(colSpan, desiredWidth, x, forcedMin) {
		return function(vals, table) {
			let result = [];
			let spanners = [];
			let auto = {};
			table.forEach(function(row) {
				row.forEach(function(cell) {
					if ((cell[colSpan] || 1) > 1) spanners.push(cell);
					else result[cell[x]] = Math.max(result[cell[x]] || 0, cell[desiredWidth] || 0, forcedMin);
				});
			});
			vals.forEach(function(val, index) {
				if (typeof val === "number") result[index] = val;
			});
			for (let k$1 = spanners.length - 1; k$1 >= 0; k$1--) {
				let cell = spanners[k$1];
				let span = cell[colSpan];
				let col = cell[x];
				let existingWidth = result[col];
				let editableCols = typeof vals[col] === "number" ? 0 : 1;
				if (typeof existingWidth === "number") for (let i$1 = 1; i$1 < span; i$1++) {
					existingWidth += 1 + result[col + i$1];
					if (typeof vals[col + i$1] !== "number") editableCols++;
				}
				else {
					existingWidth = desiredWidth === "desiredWidth" ? cell.desiredWidth - 1 : 1;
					if (!auto[col] || auto[col] < existingWidth) auto[col] = existingWidth;
				}
				if (cell[desiredWidth] > existingWidth) {
					let i$1 = 0;
					while (editableCols > 0 && cell[desiredWidth] > existingWidth) {
						if (typeof vals[col + i$1] !== "number") {
							let dif = Math.round((cell[desiredWidth] - existingWidth) / editableCols);
							existingWidth += dif;
							result[col + i$1] += dif;
							editableCols--;
						}
						i$1++;
					}
				}
			}
			Object.assign(vals, result, auto);
			for (let j$1 = 0; j$1 < vals.length; j$1++) vals[j$1] = Math.max(forcedMin, vals[j$1] || 0);
		};
	}
}));
var require_table = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const debug = require_debug();
	const utils$4 = require_utils$1();
	const tableLayout = require_layout_manager();
	var Table$1 = class extends Array {
		constructor(opts) {
			super();
			const options = utils$4.mergeOptions(opts);
			Object.defineProperty(this, "options", {
				value: options,
				enumerable: options.debug
			});
			if (options.debug) {
				switch (typeof options.debug) {
					case "boolean":
						debug.setDebugLevel(debug.WARN);
						break;
					case "number":
						debug.setDebugLevel(options.debug);
						break;
					case "string":
						debug.setDebugLevel(parseInt(options.debug, 10));
						break;
					default:
						debug.setDebugLevel(debug.WARN);
						debug.warn(`Debug option is expected to be boolean, number, or string. Received a ${typeof options.debug}`);
				}
				Object.defineProperty(this, "messages", { get() {
					return debug.debugMessages();
				} });
			}
		}
		toString() {
			let array = this;
			let headersPresent = this.options.head && this.options.head.length;
			if (headersPresent) {
				array = [this.options.head];
				if (this.length) array.push.apply(array, this);
			} else this.options.style.head = [];
			let cells = tableLayout.makeTableLayout(array);
			cells.forEach(function(row) {
				row.forEach(function(cell) {
					cell.mergeTableOptions(this.options, cells);
				}, this);
			}, this);
			tableLayout.computeWidths(this.options.colWidths, cells);
			tableLayout.computeHeights(this.options.rowHeights, cells);
			cells.forEach(function(row) {
				row.forEach(function(cell) {
					cell.init(this.options);
				}, this);
			}, this);
			let result = [];
			for (let rowIndex = 0; rowIndex < cells.length; rowIndex++) {
				let row = cells[rowIndex];
				let heightOfRow = this.options.rowHeights[rowIndex];
				if (rowIndex === 0 || !this.options.style.compact || rowIndex == 1 && headersPresent) doDraw(row, "top", result);
				for (let lineNum = 0; lineNum < heightOfRow; lineNum++) doDraw(row, lineNum, result);
				if (rowIndex + 1 == cells.length) doDraw(row, "bottom", result);
			}
			return result.join("\n");
		}
		get width() {
			return this.toString().split("\n")[0].length;
		}
	};
	Table$1.reset = () => debug.reset();
	function doDraw(row, lineNum, result) {
		let line = [];
		row.forEach(function(cell) {
			line.push(cell.draw(lineNum));
		});
		let str = line.join("");
		if (str.length) result.push(str);
	}
	module.exports = Table$1;
}));
var require_cli_table3 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require_table();
}));
function uniq(arr) {
	return Array.from(new Set(arr));
}
var require_picocolors = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	let p = process || {}, argv$1 = p.argv || [], env$1 = p.env || {};
	let isColorSupported$1 = !(!!env$1.NO_COLOR || argv$1.includes("--no-color")) && (!!env$1.FORCE_COLOR || argv$1.includes("--color") || p.platform === "win32" || (p.stdout || {}).isTTY && env$1.TERM !== "dumb" || !!env$1.CI);
	let formatter = (open, close, replace = open) => (input) => {
		let string$1 = "" + input, index = string$1.indexOf(close, open.length);
		return ~index ? open + replaceClose$1(string$1, close, replace, index) + close : open + string$1 + close;
	};
	let replaceClose$1 = (string$1, close, replace, index) => {
		let result = "", cursor = 0;
		do {
			result += string$1.substring(cursor, index) + replace;
			cursor = index + close.length;
			index = string$1.indexOf(close, cursor);
		} while (~index);
		return result + string$1.substring(cursor);
	};
	let createColors$1 = (enabled = isColorSupported$1) => {
		let f$2 = enabled ? formatter : () => String;
		return {
			isColorSupported: enabled,
			reset: f$2("\x1B[0m", "\x1B[0m"),
			bold: f$2("\x1B[1m", "\x1B[22m", "\x1B[22m\x1B[1m"),
			dim: f$2("\x1B[2m", "\x1B[22m", "\x1B[22m\x1B[2m"),
			italic: f$2("\x1B[3m", "\x1B[23m"),
			underline: f$2("\x1B[4m", "\x1B[24m"),
			inverse: f$2("\x1B[7m", "\x1B[27m"),
			hidden: f$2("\x1B[8m", "\x1B[28m"),
			strikethrough: f$2("\x1B[9m", "\x1B[29m"),
			black: f$2("\x1B[30m", "\x1B[39m"),
			red: f$2("\x1B[31m", "\x1B[39m"),
			green: f$2("\x1B[32m", "\x1B[39m"),
			yellow: f$2("\x1B[33m", "\x1B[39m"),
			blue: f$2("\x1B[34m", "\x1B[39m"),
			magenta: f$2("\x1B[35m", "\x1B[39m"),
			cyan: f$2("\x1B[36m", "\x1B[39m"),
			white: f$2("\x1B[37m", "\x1B[39m"),
			gray: f$2("\x1B[90m", "\x1B[39m"),
			bgBlack: f$2("\x1B[40m", "\x1B[49m"),
			bgRed: f$2("\x1B[41m", "\x1B[49m"),
			bgGreen: f$2("\x1B[42m", "\x1B[49m"),
			bgYellow: f$2("\x1B[43m", "\x1B[49m"),
			bgBlue: f$2("\x1B[44m", "\x1B[49m"),
			bgMagenta: f$2("\x1B[45m", "\x1B[49m"),
			bgCyan: f$2("\x1B[46m", "\x1B[49m"),
			bgWhite: f$2("\x1B[47m", "\x1B[49m"),
			blackBright: f$2("\x1B[90m", "\x1B[39m"),
			redBright: f$2("\x1B[91m", "\x1B[39m"),
			greenBright: f$2("\x1B[92m", "\x1B[39m"),
			yellowBright: f$2("\x1B[93m", "\x1B[39m"),
			blueBright: f$2("\x1B[94m", "\x1B[39m"),
			magentaBright: f$2("\x1B[95m", "\x1B[39m"),
			cyanBright: f$2("\x1B[96m", "\x1B[39m"),
			whiteBright: f$2("\x1B[97m", "\x1B[39m"),
			bgBlackBright: f$2("\x1B[100m", "\x1B[49m"),
			bgRedBright: f$2("\x1B[101m", "\x1B[49m"),
			bgGreenBright: f$2("\x1B[102m", "\x1B[49m"),
			bgYellowBright: f$2("\x1B[103m", "\x1B[49m"),
			bgBlueBright: f$2("\x1B[104m", "\x1B[49m"),
			bgMagentaBright: f$2("\x1B[105m", "\x1B[49m"),
			bgCyanBright: f$2("\x1B[106m", "\x1B[49m"),
			bgWhiteBright: f$2("\x1B[107m", "\x1B[49m")
		};
	};
	module.exports = createColors$1();
	module.exports.createColors = createColors$1;
}));
var import_cli_table3 = /* @__PURE__ */ __toESM(require_cli_table3(), 1);
function ansiRegex$2({ onlyFirst = false } = {}) {
	return new RegExp(`(?:\\u001B\\][\\s\\S]*?(?:\\u0007|\\u001B\\u005C|\\u009C))|[\\u001B\\u009B][[\\]()#;?]*(?:\\d{1,4}(?:[;:]\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]`, onlyFirst ? void 0 : "g");
}
const regex$1 = ansiRegex$2();
function stripAnsi$2(string$1) {
	if (typeof string$1 !== "string") throw new TypeError(`Expected a \`string\`, got \`${typeof string$1}\``);
	return string$1.replace(regex$1, "");
}
function isAmbiguous$1(x) {
	return x === 161 || x === 164 || x === 167 || x === 168 || x === 170 || x === 173 || x === 174 || x >= 176 && x <= 180 || x >= 182 && x <= 186 || x >= 188 && x <= 191 || x === 198 || x === 208 || x === 215 || x === 216 || x >= 222 && x <= 225 || x === 230 || x >= 232 && x <= 234 || x === 236 || x === 237 || x === 240 || x === 242 || x === 243 || x >= 247 && x <= 250 || x === 252 || x === 254 || x === 257 || x === 273 || x === 275 || x === 283 || x === 294 || x === 295 || x === 299 || x >= 305 && x <= 307 || x === 312 || x >= 319 && x <= 322 || x === 324 || x >= 328 && x <= 331 || x === 333 || x === 338 || x === 339 || x === 358 || x === 359 || x === 363 || x === 462 || x === 464 || x === 466 || x === 468 || x === 470 || x === 472 || x === 474 || x === 476 || x === 593 || x === 609 || x === 708 || x === 711 || x >= 713 && x <= 715 || x === 717 || x === 720 || x >= 728 && x <= 731 || x === 733 || x === 735 || x >= 768 && x <= 879 || x >= 913 && x <= 929 || x >= 931 && x <= 937 || x >= 945 && x <= 961 || x >= 963 && x <= 969 || x === 1025 || x >= 1040 && x <= 1103 || x === 1105 || x === 8208 || x >= 8211 && x <= 8214 || x === 8216 || x === 8217 || x === 8220 || x === 8221 || x >= 8224 && x <= 8226 || x >= 8228 && x <= 8231 || x === 8240 || x === 8242 || x === 8243 || x === 8245 || x === 8251 || x === 8254 || x === 8308 || x === 8319 || x >= 8321 && x <= 8324 || x === 8364 || x === 8451 || x === 8453 || x === 8457 || x === 8467 || x === 8470 || x === 8481 || x === 8482 || x === 8486 || x === 8491 || x === 8531 || x === 8532 || x >= 8539 && x <= 8542 || x >= 8544 && x <= 8555 || x >= 8560 && x <= 8569 || x === 8585 || x >= 8592 && x <= 8601 || x === 8632 || x === 8633 || x === 8658 || x === 8660 || x === 8679 || x === 8704 || x === 8706 || x === 8707 || x === 8711 || x === 8712 || x === 8715 || x === 8719 || x === 8721 || x === 8725 || x === 8730 || x >= 8733 && x <= 8736 || x === 8739 || x === 8741 || x >= 8743 && x <= 8748 || x === 8750 || x >= 8756 && x <= 8759 || x === 8764 || x === 8765 || x === 8776 || x === 8780 || x === 8786 || x === 8800 || x === 8801 || x >= 8804 && x <= 8807 || x === 8810 || x === 8811 || x === 8814 || x === 8815 || x === 8834 || x === 8835 || x === 8838 || x === 8839 || x === 8853 || x === 8857 || x === 8869 || x === 8895 || x === 8978 || x >= 9312 && x <= 9449 || x >= 9451 && x <= 9547 || x >= 9552 && x <= 9587 || x >= 9600 && x <= 9615 || x >= 9618 && x <= 9621 || x === 9632 || x === 9633 || x >= 9635 && x <= 9641 || x === 9650 || x === 9651 || x === 9654 || x === 9655 || x === 9660 || x === 9661 || x === 9664 || x === 9665 || x >= 9670 && x <= 9672 || x === 9675 || x >= 9678 && x <= 9681 || x >= 9698 && x <= 9701 || x === 9711 || x === 9733 || x === 9734 || x === 9737 || x === 9742 || x === 9743 || x === 9756 || x === 9758 || x === 9792 || x === 9794 || x === 9824 || x === 9825 || x >= 9827 && x <= 9829 || x >= 9831 && x <= 9834 || x === 9836 || x === 9837 || x === 9839 || x === 9886 || x === 9887 || x === 9919 || x >= 9926 && x <= 9933 || x >= 9935 && x <= 9939 || x >= 9941 && x <= 9953 || x === 9955 || x === 9960 || x === 9961 || x >= 9963 && x <= 9969 || x === 9972 || x >= 9974 && x <= 9977 || x === 9979 || x === 9980 || x === 9982 || x === 9983 || x === 10045 || x >= 10102 && x <= 10111 || x >= 11094 && x <= 11097 || x >= 12872 && x <= 12879 || x >= 57344 && x <= 63743 || x >= 65024 && x <= 65039 || x === 65533 || x >= 127232 && x <= 127242 || x >= 127248 && x <= 127277 || x >= 127280 && x <= 127337 || x >= 127344 && x <= 127373 || x === 127375 || x === 127376 || x >= 127387 && x <= 127404 || x >= 917760 && x <= 917999 || x >= 983040 && x <= 1048573 || x >= 1048576 && x <= 1114109;
}
function isFullWidth$1(x) {
	return x === 12288 || x >= 65281 && x <= 65376 || x >= 65504 && x <= 65510;
}
function isWide$1(x) {
	return x >= 4352 && x <= 4447 || x === 8986 || x === 8987 || x === 9001 || x === 9002 || x >= 9193 && x <= 9196 || x === 9200 || x === 9203 || x === 9725 || x === 9726 || x === 9748 || x === 9749 || x >= 9776 && x <= 9783 || x >= 9800 && x <= 9811 || x === 9855 || x >= 9866 && x <= 9871 || x === 9875 || x === 9889 || x === 9898 || x === 9899 || x === 9917 || x === 9918 || x === 9924 || x === 9925 || x === 9934 || x === 9940 || x === 9962 || x === 9970 || x === 9971 || x === 9973 || x === 9978 || x === 9981 || x === 9989 || x === 9994 || x === 9995 || x === 10024 || x === 10060 || x === 10062 || x >= 10067 && x <= 10069 || x === 10071 || x >= 10133 && x <= 10135 || x === 10160 || x === 10175 || x === 11035 || x === 11036 || x === 11088 || x === 11093 || x >= 11904 && x <= 11929 || x >= 11931 && x <= 12019 || x >= 12032 && x <= 12245 || x >= 12272 && x <= 12287 || x >= 12289 && x <= 12350 || x >= 12353 && x <= 12438 || x >= 12441 && x <= 12543 || x >= 12549 && x <= 12591 || x >= 12593 && x <= 12686 || x >= 12688 && x <= 12773 || x >= 12783 && x <= 12830 || x >= 12832 && x <= 12871 || x >= 12880 && x <= 42124 || x >= 42128 && x <= 42182 || x >= 43360 && x <= 43388 || x >= 44032 && x <= 55203 || x >= 63744 && x <= 64255 || x >= 65040 && x <= 65049 || x >= 65072 && x <= 65106 || x >= 65108 && x <= 65126 || x >= 65128 && x <= 65131 || x >= 94176 && x <= 94180 || x >= 94192 && x <= 94198 || x >= 94208 && x <= 101589 || x >= 101631 && x <= 101662 || x >= 101760 && x <= 101874 || x >= 110576 && x <= 110579 || x >= 110581 && x <= 110587 || x === 110589 || x === 110590 || x >= 110592 && x <= 110882 || x === 110898 || x >= 110928 && x <= 110930 || x === 110933 || x >= 110948 && x <= 110951 || x >= 110960 && x <= 111355 || x >= 119552 && x <= 119638 || x >= 119648 && x <= 119670 || x === 126980 || x === 127183 || x === 127374 || x >= 127377 && x <= 127386 || x >= 127488 && x <= 127490 || x >= 127504 && x <= 127547 || x >= 127552 && x <= 127560 || x === 127568 || x === 127569 || x >= 127584 && x <= 127589 || x >= 127744 && x <= 127776 || x >= 127789 && x <= 127797 || x >= 127799 && x <= 127868 || x >= 127870 && x <= 127891 || x >= 127904 && x <= 127946 || x >= 127951 && x <= 127955 || x >= 127968 && x <= 127984 || x === 127988 || x >= 127992 && x <= 128062 || x === 128064 || x >= 128066 && x <= 128252 || x >= 128255 && x <= 128317 || x >= 128331 && x <= 128334 || x >= 128336 && x <= 128359 || x === 128378 || x === 128405 || x === 128406 || x === 128420 || x >= 128507 && x <= 128591 || x >= 128640 && x <= 128709 || x === 128716 || x >= 128720 && x <= 128722 || x >= 128725 && x <= 128728 || x >= 128732 && x <= 128735 || x === 128747 || x === 128748 || x >= 128756 && x <= 128764 || x >= 128992 && x <= 129003 || x === 129008 || x >= 129292 && x <= 129338 || x >= 129340 && x <= 129349 || x >= 129351 && x <= 129535 || x >= 129648 && x <= 129660 || x >= 129664 && x <= 129674 || x >= 129678 && x <= 129734 || x === 129736 || x >= 129741 && x <= 129756 || x >= 129759 && x <= 129770 || x >= 129775 && x <= 129784 || x >= 131072 && x <= 196605 || x >= 196608 && x <= 262141;
}
function validate$1(codePoint) {
	if (!Number.isSafeInteger(codePoint)) throw new TypeError(`Expected a code point, got \`${typeof codePoint}\`.`);
}
function eastAsianWidth$1(codePoint, { ambiguousAsWide = false } = {}) {
	validate$1(codePoint);
	if (isFullWidth$1(codePoint) || isWide$1(codePoint) || ambiguousAsWide && isAmbiguous$1(codePoint)) return 2;
	return 1;
}
var import_emoji_regex = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = () => {
		return /[#*0-9]\uFE0F?\u20E3|[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23ED-\u23EF\u23F1\u23F2\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692\u2694-\u2697\u2699\u269B\u269C\u26A0\u26A7\u26AA\u26B0\u26B1\u26BD\u26BE\u26C4\u26C8\u26CF\u26D1\u26E9\u26F0-\u26F5\u26F7\u26F8\u26FA\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2757\u2763\u27A1\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B55\u3030\u303D\u3297\u3299]\uFE0F?|[\u261D\u270C\u270D](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?|[\u270A\u270B](?:\uD83C[\uDFFB-\uDFFF])?|[\u23E9-\u23EC\u23F0\u23F3\u25FD\u2693\u26A1\u26AB\u26C5\u26CE\u26D4\u26EA\u26FD\u2705\u2728\u274C\u274E\u2753-\u2755\u2795-\u2797\u27B0\u27BF\u2B50]|\u26D3\uFE0F?(?:\u200D\uD83D\uDCA5)?|\u26F9(?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|\u2764\uFE0F?(?:\u200D(?:\uD83D\uDD25|\uD83E\uDE79))?|\uD83C(?:[\uDC04\uDD70\uDD71\uDD7E\uDD7F\uDE02\uDE37\uDF21\uDF24-\uDF2C\uDF36\uDF7D\uDF96\uDF97\uDF99-\uDF9B\uDF9E\uDF9F\uDFCD\uDFCE\uDFD4-\uDFDF\uDFF5\uDFF7]\uFE0F?|[\uDF85\uDFC2\uDFC7](?:\uD83C[\uDFFB-\uDFFF])?|[\uDFC4\uDFCA](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDFCB\uDFCC](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDCCF\uDD8E\uDD91-\uDD9A\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF43\uDF45-\uDF4A\uDF4C-\uDF7C\uDF7E-\uDF84\uDF86-\uDF93\uDFA0-\uDFC1\uDFC5\uDFC6\uDFC8\uDFC9\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF8-\uDFFF]|\uDDE6\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF]|\uDDE7\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF]|\uDDE8\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF7\uDDFA-\uDDFF]|\uDDE9\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF]|\uDDEA\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA]|\uDDEB\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7]|\uDDEC\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE]|\uDDED\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA]|\uDDEE\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9]|\uDDEF\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5]|\uDDF0\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF]|\uDDF1\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE]|\uDDF2\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF]|\uDDF3\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF]|\uDDF4\uD83C\uDDF2|\uDDF5\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE]|\uDDF6\uD83C\uDDE6|\uDDF7\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC]|\uDDF8\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF]|\uDDF9\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF]|\uDDFA\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF]|\uDDFB\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA]|\uDDFC\uD83C[\uDDEB\uDDF8]|\uDDFD\uD83C\uDDF0|\uDDFE\uD83C[\uDDEA\uDDF9]|\uDDFF\uD83C[\uDDE6\uDDF2\uDDFC]|\uDF44(?:\u200D\uD83D\uDFEB)?|\uDF4B(?:\u200D\uD83D\uDFE9)?|\uDFC3(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDFF3\uFE0F?(?:\u200D(?:\u26A7\uFE0F?|\uD83C\uDF08))?|\uDFF4(?:\u200D\u2620\uFE0F?|\uDB40\uDC67\uDB40\uDC62\uDB40(?:\uDC65\uDB40\uDC6E\uDB40\uDC67|\uDC73\uDB40\uDC63\uDB40\uDC74|\uDC77\uDB40\uDC6C\uDB40\uDC73)\uDB40\uDC7F)?)|\uD83D(?:[\uDC3F\uDCFD\uDD49\uDD4A\uDD6F\uDD70\uDD73\uDD76-\uDD79\uDD87\uDD8A-\uDD8D\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA\uDECB\uDECD-\uDECF\uDEE0-\uDEE5\uDEE9\uDEF0\uDEF3]\uFE0F?|[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC](?:\uD83C[\uDFFB-\uDFFF])?|[\uDC6E-\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4\uDEB5](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD74\uDD90](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?|[\uDC00-\uDC07\uDC09-\uDC14\uDC16-\uDC25\uDC27-\uDC3A\uDC3C-\uDC3E\uDC40\uDC44\uDC45\uDC51-\uDC65\uDC6A\uDC79-\uDC7B\uDC7D-\uDC80\uDC84\uDC88-\uDC8E\uDC90\uDC92-\uDCA9\uDCAB-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDDA4\uDDFB-\uDE2D\uDE2F-\uDE34\uDE37-\uDE41\uDE43\uDE44\uDE48-\uDE4A\uDE80-\uDEA2\uDEA4-\uDEB3\uDEB7-\uDEBF\uDEC1-\uDEC5\uDED0-\uDED2\uDED5-\uDED8\uDEDC-\uDEDF\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB\uDFF0]|\uDC08(?:\u200D\u2B1B)?|\uDC15(?:\u200D\uD83E\uDDBA)?|\uDC26(?:\u200D(?:\u2B1B|\uD83D\uDD25))?|\uDC3B(?:\u200D\u2744\uFE0F?)?|\uDC41\uFE0F?(?:\u200D\uD83D\uDDE8\uFE0F?)?|\uDC68(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDC68\uDC69]\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFC-\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFC-\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFD-\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFD\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFE])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFE]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?))?|\uDC69(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?[\uDC68\uDC69]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?|\uDC69\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?))|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFC-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFC-\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFD-\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFD\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFE])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFE]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFE])))?))?|\uDD75(?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|\uDE2E(?:\u200D\uD83D\uDCA8)?|\uDE35(?:\u200D\uD83D\uDCAB)?|\uDE36(?:\u200D\uD83C\uDF2B\uFE0F?)?|\uDE42(?:\u200D[\u2194\u2195]\uFE0F?)?|\uDEB6(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?)|\uD83E(?:[\uDD0C\uDD0F\uDD18-\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5\uDEC3-\uDEC5\uDEF0\uDEF2-\uDEF8](?:\uD83C[\uDFFB-\uDFFF])?|[\uDD26\uDD35\uDD37-\uDD39\uDD3C-\uDD3E\uDDB8\uDDB9\uDDCD\uDDCF\uDDD4\uDDD6-\uDDDD](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDDDE\uDDDF](?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD0D\uDD0E\uDD10-\uDD17\uDD20-\uDD25\uDD27-\uDD2F\uDD3A\uDD3F-\uDD45\uDD47-\uDD76\uDD78-\uDDB4\uDDB7\uDDBA\uDDBC-\uDDCC\uDDD0\uDDE0-\uDDFF\uDE70-\uDE7C\uDE80-\uDE8A\uDE8E-\uDEC2\uDEC6\uDEC8\uDECD-\uDEDC\uDEDF-\uDEEA\uDEEF]|\uDDCE(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDDD1(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1|\uDDD1\u200D\uD83E\uDDD2(?:\u200D\uD83E\uDDD2)?|\uDDD2(?:\u200D\uD83E\uDDD2)?))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE])))?))?|\uDEF1(?:\uD83C(?:\uDFFB(?:\u200D\uD83E\uDEF2\uD83C[\uDFFC-\uDFFF])?|\uDFFC(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFD-\uDFFF])?|\uDFFD(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])?|\uDFFE(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFD\uDFFF])?|\uDFFF(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFE])?))?)/g;
	};
})))(), 1);
const segmenter$1 = new Intl.Segmenter();
const defaultIgnorableCodePointRegex$1 = /^\p{Default_Ignorable_Code_Point}$/u;
function stringWidth$2(string$1, options = {}) {
	if (typeof string$1 !== "string" || string$1.length === 0) return 0;
	const { ambiguousIsNarrow = true, countAnsiEscapeCodes = false } = options;
	if (!countAnsiEscapeCodes) string$1 = stripAnsi$2(string$1);
	if (string$1.length === 0) return 0;
	let width = 0;
	const eastAsianWidthOptions = { ambiguousAsWide: !ambiguousIsNarrow };
	for (const { segment: character } of segmenter$1.segment(string$1)) {
		const codePoint = character.codePointAt(0);
		if (codePoint <= 31 || codePoint >= 127 && codePoint <= 159) continue;
		if (codePoint >= 8203 && codePoint <= 8207 || codePoint === 65279) continue;
		if (codePoint >= 768 && codePoint <= 879 || codePoint >= 6832 && codePoint <= 6911 || codePoint >= 7616 && codePoint <= 7679 || codePoint >= 8400 && codePoint <= 8447 || codePoint >= 65056 && codePoint <= 65071) continue;
		if (codePoint >= 55296 && codePoint <= 57343) continue;
		if (codePoint >= 65024 && codePoint <= 65039) continue;
		if (defaultIgnorableCodePointRegex$1.test(character)) continue;
		if ((0, import_emoji_regex.default)().test(character)) {
			width += 2;
			continue;
		}
		width += eastAsianWidth$1(codePoint, eastAsianWidthOptions);
	}
	return width;
}
const DEFAULT_LOCALE$1 = "en-CA";
function createDatePartsFormatter(timezone, locale) {
	return new Intl.DateTimeFormat(locale, {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		timeZone: timezone
	});
}
function formatDateCompact(dateStr, timezone, locale) {
	const date = /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? timezone != null ? /* @__PURE__ */ new Date(`${dateStr}T00:00:00Z`) : /* @__PURE__ */ new Date(`${dateStr}T00:00:00`) : new Date(dateStr);
	const parts = createDatePartsFormatter(timezone, locale ?? DEFAULT_LOCALE$1).formatToParts(date);
	return `${parts.find((p$1) => p$1.type === "year")?.value ?? ""}\n${parts.find((p$1) => p$1.type === "month")?.value ?? ""}-${parts.find((p$1) => p$1.type === "day")?.value ?? ""}`;
}
var ResponsiveTable = class {
	head;
	rows = [];
	colAligns;
	style;
	dateFormatter;
	compactHead;
	compactColAligns;
	compactThreshold;
	compactMode = false;
	forceCompact;
	logger;
	constructor(options) {
		this.head = options.head;
		this.colAligns = options.colAligns ?? Array.from({ length: this.head.length }, () => "left");
		this.style = options.style;
		this.dateFormatter = options.dateFormatter;
		this.compactHead = options.compactHead;
		this.compactColAligns = options.compactColAligns;
		this.compactThreshold = options.compactThreshold ?? 100;
		this.forceCompact = options.forceCompact ?? false;
		this.logger = options.logger ?? console.warn;
	}
	push(row) {
		this.rows.push(row);
	}
	filterRowToCompact(row, compactIndices) {
		return compactIndices.map((index) => row[index] ?? "");
	}
	getCurrentTableConfig() {
		if (this.compactMode && this.compactHead != null && this.compactColAligns != null) return {
			head: this.compactHead,
			colAligns: this.compactColAligns
		};
		return {
			head: this.head,
			colAligns: this.colAligns
		};
	}
	getCompactIndices() {
		if (this.compactHead == null || !this.compactMode) return Array.from({ length: this.head.length }, (_$1, i$1) => i$1);
		return this.compactHead.map((compactHeader) => {
			const index = this.head.indexOf(compactHeader);
			if (index < 0) {
				this.logger(`Warning: Compact header "${compactHeader}" not found in table headers [${this.head.join(", ")}]. Using first column as fallback.`);
				return 0;
			}
			return index;
		});
	}
	isCompactMode() {
		return this.compactMode;
	}
	toString() {
		const terminalWidth = Number.parseInt(process$1.env.COLUMNS ?? "", 10) || process$1.stdout.columns || 120;
		this.compactMode = this.forceCompact || terminalWidth < this.compactThreshold && this.compactHead != null;
		const { head, colAligns } = this.getCurrentTableConfig();
		const compactIndices = this.getCompactIndices();
		const dataRows = this.rows.filter((row) => !this.isSeparatorRow(row));
		const processedDataRows = this.compactMode ? dataRows.map((row) => this.filterRowToCompact(row, compactIndices)) : dataRows;
		const allRows = [head.map(String), ...processedDataRows.map((row) => row.map((cell) => {
			if (typeof cell === "object" && cell != null && "content" in cell) return String(cell.content);
			return String(cell ?? "");
		}))];
		const contentWidths = head.map((_$1, colIndex) => {
			return Math.max(...allRows.map((row) => stringWidth$2(String(row[colIndex] ?? ""))));
		});
		const tableOverhead = 3 * head.length + 1;
		const availableWidth = terminalWidth - tableOverhead;
		const columnWidths = contentWidths.map((width, index) => {
			if (colAligns[index] === "right") return Math.max(width + 3, 11);
			else if (index === 1) return Math.max(width + 2, 15);
			return Math.max(width + 2, 10);
		});
		if (columnWidths.reduce((sum, width) => sum + width, 0) + tableOverhead > terminalWidth) {
			const scaleFactor = availableWidth / columnWidths.reduce((sum, width) => sum + width, 0);
			const adjustedWidths = columnWidths.map((width, index) => {
				const align = colAligns[index];
				let adjustedWidth = Math.floor(width * scaleFactor);
				if (align === "right") adjustedWidth = Math.max(adjustedWidth, 10);
				else if (index === 0) adjustedWidth = Math.max(adjustedWidth, 10);
				else if (index === 1) adjustedWidth = Math.max(adjustedWidth, 12);
				else adjustedWidth = Math.max(adjustedWidth, 8);
				return adjustedWidth;
			});
			const table = new import_cli_table3.default({
				head,
				style: this.style,
				colAligns,
				colWidths: adjustedWidths,
				wordWrap: true,
				wrapOnWordBoundary: true
			});
			for (const row of this.rows) if (this.isSeparatorRow(row)) continue;
			else {
				let processedRow = row.map((cell, index) => {
					if (index === 0 && this.dateFormatter != null && typeof cell === "string" && this.isDateString(cell)) return this.dateFormatter(cell);
					return cell;
				});
				if (this.compactMode) processedRow = this.filterRowToCompact(processedRow, compactIndices);
				table.push(processedRow);
			}
			return table.toString();
		} else {
			const table = new import_cli_table3.default({
				head,
				style: this.style,
				colAligns,
				colWidths: columnWidths,
				wordWrap: true,
				wrapOnWordBoundary: true
			});
			for (const row of this.rows) if (this.isSeparatorRow(row)) continue;
			else {
				const processedRow = this.compactMode ? this.filterRowToCompact(row, compactIndices) : row;
				table.push(processedRow);
			}
			return table.toString();
		}
	}
	isSeparatorRow(row) {
		return row.every((cell) => {
			if (typeof cell === "object" && cell != null && "content" in cell) return cell.content === "" || /^─+$/.test(cell.content);
			return typeof cell === "string" && (cell === "" || /^─+$/.test(cell));
		});
	}
	isDateString(text) {
		return /^\d{4}-\d{2}-\d{2}$/.test(text);
	}
};
function formatNumber(num) {
	return num.toLocaleString("en-US");
}
function formatCurrency(amount) {
	return `$${amount.toFixed(2)}`;
}
function formatModelName(modelName) {
	const piMatch = modelName.match(/^\[pi\] (.+)$/);
	if (piMatch?.[1] != null) return `[pi] ${formatModelName(piMatch[1])}`;
	const anthropicMatch = modelName.match(/^anthropic\/claude-(\w+)-([\d.]+)$/);
	if (anthropicMatch != null) return `${anthropicMatch[1]}-${anthropicMatch[2]}`;
	const match = modelName.match(/^claude-(\w+)-([\d-]+)-(\d{8})$/);
	if (match != null) return `${match[1]}-${match[2]}`;
	const noDateMatch = modelName.match(/^claude-(\w+)-([\d-]+)$/);
	if (noDateMatch != null) return `${noDateMatch[1]}-${noDateMatch[2]}`;
	return modelName;
}
function formatModelsDisplayMultiline(models) {
	return uniq(models.map(formatModelName)).sort().map((model) => `- ${model}`).join("\n");
}
function addEmptySeparatorRow(table, columnCount) {
	const emptyRow = Array.from({ length: columnCount }, () => "");
	table.push(emptyRow);
}
const CODEX_HOME_ENV = "CODEX_HOME";
const DEFAULT_CODEX_DIR = path.join(os.homedir(), ".codex");
const DEFAULT_SESSION_SUBDIR = "sessions";
const SESSION_GLOB = "**/*.jsonl";
const DEFAULT_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
const DEFAULT_LOCALE = "en-CA";
const MILLION = 1e6;
const sharedArgs = {
	json: {
		type: "boolean",
		short: "j",
		description: "Output report as JSON",
		default: false
	},
	since: {
		type: "string",
		short: "s",
		description: "Filter from date (YYYY-MM-DD or YYYYMMDD)"
	},
	until: {
		type: "string",
		short: "u",
		description: "Filter until date (inclusive)"
	},
	timezone: {
		type: "string",
		short: "z",
		description: "Timezone for date grouping (IANA)",
		default: DEFAULT_TIMEZONE
	},
	locale: {
		type: "string",
		short: "l",
		description: "Locale for formatting",
		default: DEFAULT_LOCALE
	},
	offline: {
		type: "boolean",
		short: "O",
		description: "Use cached pricing data instead of fetching from LiteLLM",
		default: false,
		negatable: true
	},
	compact: {
		type: "boolean",
		description: "Force compact table layout for narrow terminals",
		default: false
	},
	color: {
		type: "boolean",
		description: "Enable colored output (default: auto). FORCE_COLOR=1 has the same effect."
	},
	noColor: {
		type: "boolean",
		description: "Disable colored output (default: auto). NO_COLOR=1 has the same effect."
	}
};
var castComparer = function(comparer) {
	return function(a$2, b$2, order) {
		return comparer(a$2, b$2, order) * order;
	};
};
var throwInvalidConfigErrorIfTrue = function(condition, context) {
	if (condition) throw Error("Invalid sort config: " + context);
};
var unpackObjectSorter = function(sortByObj) {
	var _a = sortByObj || {}, asc = _a.asc, desc = _a.desc;
	var order = asc ? 1 : -1;
	var sortBy = asc || desc;
	throwInvalidConfigErrorIfTrue(!sortBy, "Expected `asc` or `desc` property");
	throwInvalidConfigErrorIfTrue(asc && desc, "Ambiguous object with `asc` and `desc` config properties");
	return {
		order,
		sortBy,
		comparer: sortByObj.comparer && castComparer(sortByObj.comparer)
	};
};
var multiPropertySorterProvider = function(defaultComparer$1) {
	return function multiPropertySorter(sortBy, sortByArr, depth$1, order, comparer, a$2, b$2) {
		var valA;
		var valB;
		if (typeof sortBy === "string") {
			valA = a$2[sortBy];
			valB = b$2[sortBy];
		} else if (typeof sortBy === "function") {
			valA = sortBy(a$2);
			valB = sortBy(b$2);
		} else {
			var objectSorterConfig = unpackObjectSorter(sortBy);
			return multiPropertySorter(objectSorterConfig.sortBy, sortByArr, depth$1, objectSorterConfig.order, objectSorterConfig.comparer || defaultComparer$1, a$2, b$2);
		}
		var equality = comparer(valA, valB, order);
		if ((equality === 0 || valA == null && valB == null) && sortByArr.length > depth$1) return multiPropertySorter(sortByArr[depth$1], sortByArr, depth$1 + 1, order, comparer, a$2, b$2);
		return equality;
	};
};
function getSortStrategy(sortBy, comparer, order) {
	if (sortBy === void 0 || sortBy === true) return function(a$2, b$2) {
		return comparer(a$2, b$2, order);
	};
	if (typeof sortBy === "string") {
		throwInvalidConfigErrorIfTrue(sortBy.includes("."), "String syntax not allowed for nested properties.");
		return function(a$2, b$2) {
			return comparer(a$2[sortBy], b$2[sortBy], order);
		};
	}
	if (typeof sortBy === "function") return function(a$2, b$2) {
		return comparer(sortBy(a$2), sortBy(b$2), order);
	};
	if (Array.isArray(sortBy)) {
		var multiPropSorter_1 = multiPropertySorterProvider(comparer);
		return function(a$2, b$2) {
			return multiPropSorter_1(sortBy[0], sortBy, 1, order, comparer, a$2, b$2);
		};
	}
	var objectSorterConfig = unpackObjectSorter(sortBy);
	return getSortStrategy(objectSorterConfig.sortBy, objectSorterConfig.comparer || comparer, objectSorterConfig.order);
}
var sortArray = function(order, ctx, sortBy, comparer) {
	var _a;
	if (!Array.isArray(ctx)) return ctx;
	if (Array.isArray(sortBy) && sortBy.length < 2) _a = sortBy, sortBy = _a[0];
	return ctx.sort(getSortStrategy(sortBy, comparer, order));
};
function createNewSortInstance(opts) {
	var comparer = castComparer(opts.comparer);
	return function(arrayToSort) {
		var ctx = Array.isArray(arrayToSort) && !opts.inPlaceSorting ? arrayToSort.slice() : arrayToSort;
		return {
			asc: function(sortBy) {
				return sortArray(1, ctx, sortBy, comparer);
			},
			desc: function(sortBy) {
				return sortArray(-1, ctx, sortBy, comparer);
			},
			by: function(sortBy) {
				return sortArray(1, ctx, sortBy, comparer);
			}
		};
	};
}
var defaultComparer = function(a$2, b$2, order) {
	if (a$2 == null) return order;
	if (b$2 == null) return -order;
	if (typeof a$2 !== typeof b$2) return typeof a$2 < typeof b$2 ? -1 : 1;
	if (a$2 < b$2) return -1;
	if (a$2 > b$2) return 1;
	return 0;
};
var sort = createNewSortInstance({ comparer: defaultComparer });
createNewSortInstance({
	comparer: defaultComparer,
	inPlaceSorting: true
});
function splitUsageTokens(usage) {
	const cacheReadTokens = Math.min(usage.cachedInputTokens, usage.inputTokens);
	const inputTokens = Math.max(usage.inputTokens - cacheReadTokens, 0);
	const outputTokens = Math.max(usage.outputTokens, 0);
	const rawReasoning = usage.reasoningOutputTokens ?? 0;
	return {
		inputTokens,
		reasoningTokens: Math.max(0, Math.min(rawReasoning, outputTokens)),
		cacheReadTokens,
		outputTokens
	};
}
function formatModelsList(models) {
	return sort(Object.entries(models)).asc(([model]) => model).map(([model, data]) => data.isFallback === true ? `${model} (fallback)` : model);
}
function safeTimeZone(timezone) {
	if (timezone == null || timezone.trim() === "") return Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
	try {
		Intl.DateTimeFormat("en-US", { timeZone: timezone });
		return timezone;
	} catch {
		return "UTC";
	}
}
function toDateKey(timestamp, timezone) {
	const tz = safeTimeZone(timezone);
	const date = new Date(timestamp);
	return new Intl.DateTimeFormat("en-CA", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		timeZone: tz
	}).format(date);
}
function normalizeFilterDate(value) {
	if (value == null) return;
	const compact = value.replaceAll("-", "").trim();
	if (!/^\d{8}$/.test(compact)) throw new Error(`Invalid date format: ${value}. Expected YYYYMMDD or YYYY-MM-DD.`);
	return `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}`;
}
function isWithinRange(dateKey, since, until) {
	const value = dateKey.replaceAll("-", "");
	const sinceValue = since?.replaceAll("-", "");
	const untilValue = until?.replaceAll("-", "");
	if (sinceValue != null && value < sinceValue) return false;
	if (untilValue != null && value > untilValue) return false;
	return true;
}
function formatDisplayDate(dateKey, locale, _timezone) {
	const [yearStr = "0", monthStr = "1", dayStr = "1"] = dateKey.split("-");
	const year = Number.parseInt(yearStr, 10);
	const month = Number.parseInt(monthStr, 10);
	const day = Number.parseInt(dayStr, 10);
	const date = new Date(Date.UTC(year, month - 1, day));
	return new Intl.DateTimeFormat(locale ?? "en-US", {
		year: "numeric",
		month: "short",
		day: "2-digit",
		timeZone: "UTC"
	}).format(date);
}
function toMonthKey(timestamp, timezone) {
	const tz = safeTimeZone(timezone);
	const date = new Date(timestamp);
	const [year, month] = new Intl.DateTimeFormat("en-CA", {
		year: "numeric",
		month: "2-digit",
		timeZone: tz
	}).format(date).split("-");
	return `${year}-${month}`;
}
function formatDisplayMonth(monthKey, locale, _timezone) {
	const [yearStr = "0", monthStr = "1"] = monthKey.split("-");
	const year = Number.parseInt(yearStr, 10);
	const month = Number.parseInt(monthStr, 10);
	const date = new Date(Date.UTC(year, month - 1, 1));
	return new Intl.DateTimeFormat(locale ?? "en-US", {
		year: "numeric",
		month: "short",
		timeZone: "UTC"
	}).format(date);
}
function formatDisplayDateTime(timestamp, locale, timezone) {
	const tz = safeTimeZone(timezone);
	const date = new Date(timestamp);
	return new Intl.DateTimeFormat(locale ?? "en-US", {
		dateStyle: "short",
		timeStyle: "short",
		timeZone: tz
	}).format(date);
}
function createEmptyUsage() {
	return {
		inputTokens: 0,
		cachedInputTokens: 0,
		outputTokens: 0,
		reasoningOutputTokens: 0,
		totalTokens: 0
	};
}
function addUsage(target, delta) {
	target.inputTokens += delta.inputTokens;
	target.cachedInputTokens += delta.cachedInputTokens;
	target.outputTokens += delta.outputTokens;
	target.reasoningOutputTokens += delta.reasoningOutputTokens;
	target.totalTokens += delta.totalTokens;
}
function nonCachedInputTokens(usage) {
	const nonCached = usage.inputTokens - usage.cachedInputTokens;
	return nonCached > 0 ? nonCached : 0;
}
function calculateCostUSD(usage, pricing) {
	const nonCachedInput = nonCachedInputTokens(usage);
	const cachedInput = usage.cachedInputTokens > usage.inputTokens ? usage.inputTokens : usage.cachedInputTokens;
	const outputTokens = usage.outputTokens;
	const inputCost = nonCachedInput / MILLION * pricing.inputCostPerMToken;
	const cachedCost = cachedInput / MILLION * pricing.cachedInputCostPerMToken;
	const outputCost = outputTokens / MILLION * pricing.outputCostPerMToken;
	return inputCost + cachedCost + outputCost;
}
function createSummary$2(date, initialTimestamp) {
	return {
		date,
		firstTimestamp: initialTimestamp,
		inputTokens: 0,
		cachedInputTokens: 0,
		outputTokens: 0,
		reasoningOutputTokens: 0,
		totalTokens: 0,
		costUSD: 0,
		models: /* @__PURE__ */ new Map()
	};
}
async function buildDailyReport(events, options) {
	const timezone = options.timezone;
	const locale = options.locale;
	const since = options.since;
	const until = options.until;
	const pricingSource = options.pricingSource;
	const summaries = /* @__PURE__ */ new Map();
	for (const event of events) {
		const modelName = event.model?.trim();
		if (modelName == null || modelName === "") continue;
		const dateKey = toDateKey(event.timestamp, timezone);
		if (!isWithinRange(dateKey, since, until)) continue;
		const summary = summaries.get(dateKey) ?? createSummary$2(dateKey, event.timestamp);
		if (!summaries.has(dateKey)) summaries.set(dateKey, summary);
		addUsage(summary, event);
		const modelUsage = summary.models.get(modelName) ?? {
			...createEmptyUsage(),
			isFallback: false
		};
		if (!summary.models.has(modelName)) summary.models.set(modelName, modelUsage);
		addUsage(modelUsage, event);
		if (event.isFallbackModel === true) modelUsage.isFallback = true;
	}
	const uniqueModels = /* @__PURE__ */ new Set();
	for (const summary of summaries.values()) for (const modelName of summary.models.keys()) uniqueModels.add(modelName);
	const modelPricing = /* @__PURE__ */ new Map();
	for (const modelName of uniqueModels) modelPricing.set(modelName, await pricingSource.getPricing(modelName));
	const rows = [];
	const sortedSummaries = Array.from(summaries.values()).sort((a$2, b$2) => a$2.date.localeCompare(b$2.date));
	for (const summary of sortedSummaries) {
		let cost = 0;
		for (const [modelName, usage] of summary.models) {
			const pricing = modelPricing.get(modelName);
			if (pricing == null) continue;
			cost += calculateCostUSD(usage, pricing);
		}
		summary.costUSD = cost;
		const rowModels = {};
		for (const [modelName, usage] of summary.models) rowModels[modelName] = { ...usage };
		rows.push({
			date: formatDisplayDate(summary.date, locale, timezone),
			inputTokens: summary.inputTokens,
			cachedInputTokens: summary.cachedInputTokens,
			outputTokens: summary.outputTokens,
			reasoningOutputTokens: summary.reasoningOutputTokens,
			totalTokens: summary.totalTokens,
			costUSD: cost,
			models: rowModels
		});
	}
	return rows;
}
const isFailure = (result) => "Failure" === result.type;
const isPromise = (value) => "object" == typeof value && null !== value && "then" in value && "function" == typeof value.then && "catch" in value && "function" == typeof value.catch;
const andThen = (fn) => (result) => {
	const apply = (r$1) => {
		if (isFailure(r$1)) return r$1;
		return fn(r$1.value);
	};
	return isPromise(result) ? result.then(apply) : apply(result);
};
const andThrough = (fn) => (result) => {
	const apply = (r$1) => {
		if (isFailure(r$1)) return r$1;
		const next = fn(r$1.value);
		if (isPromise(next)) return next.then((n$2) => {
			if (isFailure(n$2)) return n$2;
			return r$1;
		});
		if (isFailure(next)) return next;
		return r$1;
	};
	return isPromise(result) ? result.then(apply) : apply(result);
};
const isSuccess = (result) => "Success" === result.type;
const succeed = (...args) => {
	if (args.length <= 0) return { type: "Success" };
	const value = args[0];
	if (isPromise(value)) return value.then((value$1) => ({
		type: "Success",
		value: value$1
	}));
	return {
		type: "Success",
		value
	};
};
const fail = (...args) => {
	if (args.length <= 0) return { type: "Failure" };
	const error = args[0];
	if (isPromise(error)) return error.then((error$1) => ({
		type: "Failure",
		error: error$1
	}));
	return {
		type: "Failure",
		error
	};
};
const inspect = (fn) => (result) => {
	const apply = (r$1) => {
		if (isSuccess(r$1)) fn(r$1.value);
		return r$1;
	};
	return isPromise(result) ? result.then(apply) : apply(result);
};
const inspectError = (fn) => (result) => {
	const apply = (r$1) => {
		if (isFailure(r$1)) fn(r$1.error);
		return r$1;
	};
	return isPromise(result) ? result.then(apply) : apply(result);
};
const map = (fn) => (result) => {
	const apply = (r$1) => {
		if (isFailure(r$1)) return r$1;
		return succeed(fn(r$1.value));
	};
	if (isPromise(result)) return result.then(apply);
	return apply(result);
};
const orElse = (fn) => (result) => {
	const apply = (r$1) => {
		if (isSuccess(r$1)) return r$1;
		return fn(r$1.error);
	};
	return isPromise(result) ? result.then(apply) : apply(result);
};
const pipe = (value, ...functions) => {
	let next = value;
	for (const func of functions) next = func(next);
	return next;
};
const try_ = (options) => {
	if (isPromise(options.try)) {
		if ("safe" in options && options.safe) return succeed(options.try);
		return options.try.then((value) => succeed(value), (error) => fail(options.catch(error)));
	}
	return (...args) => {
		try {
			const output = options.try(...args);
			if (isPromise(output)) {
				const promise$1 = succeed(output);
				if ("safe" in options && options.safe) return promise$1;
				return promise$1.catch((error) => fail(options.catch(error)));
			}
			return succeed(output);
		} catch (error) {
			if ("safe" in options && options.safe) throw error;
			return fail(options.catch(error));
		}
	};
};
var d = Object.defineProperty;
var n$1 = (s$1, t$1) => d(s$1, "name", {
	value: t$1,
	configurable: !0
});
typeof Symbol.asyncDispose != "symbol" && Object.defineProperty(Symbol, "asyncDispose", {
	configurable: !1,
	enumerable: !1,
	writable: !1,
	value: Symbol.for("asyncDispose")
});
var P = class {
	static {
		n$1(this, "FsFixture");
	}
	path;
	constructor(t$1) {
		this.path = t$1;
	}
	getPath(...t$1) {
		return path.join(this.path, ...t$1);
	}
	exists(t$1 = "") {
		return a.access(this.getPath(t$1)).then(() => !0, () => !1);
	}
	rm(t$1 = "") {
		return a.rm(this.getPath(t$1), {
			recursive: !0,
			force: !0
		});
	}
	cp(t$1, r$1, i$1) {
		return r$1 ? r$1.endsWith(path.sep) && (r$1 += path.basename(t$1)) : r$1 = path.basename(t$1), a.cp(t$1, this.getPath(r$1), i$1);
	}
	mkdir(t$1) {
		return a.mkdir(this.getPath(t$1), { recursive: !0 });
	}
	writeFile(t$1, r$1) {
		return a.writeFile(this.getPath(t$1), r$1);
	}
	writeJson(t$1, r$1) {
		return this.writeFile(t$1, JSON.stringify(r$1, null, 2));
	}
	readFile(t$1, r$1) {
		return a.readFile(this.getPath(t$1), r$1);
	}
	async [Symbol.asyncDispose]() {
		await this.rm();
	}
};
const v = b.realpathSync(os.tmpdir()), D$1 = `fs-fixture-${Date.now()}-${process.pid}`;
let m = 0;
const j = n$1(() => (m += 1, m), "getId");
var u$1 = class {
	static {
		n$1(this, "Path");
	}
	path;
	constructor(t$1) {
		this.path = t$1;
	}
};
var f$1 = class extends u$1 {
	static {
		n$1(this, "Directory");
	}
};
var y$1 = class extends u$1 {
	static {
		n$1(this, "File");
	}
	content;
	constructor(t$1, r$1) {
		super(t$1), this.content = r$1;
	}
};
var l$1 = class {
	static {
		n$1(this, "Symlink");
	}
	target;
	type;
	path;
	constructor(t$1, r$1) {
		this.target = t$1, this.type = r$1;
	}
};
const w = n$1((s$1, t$1, r$1) => {
	const i$1 = [];
	for (const p$1 in s$1) {
		if (!Object.hasOwn(s$1, p$1)) continue;
		const e = path.join(t$1, p$1);
		let o$1 = s$1[p$1];
		if (typeof o$1 == "function") {
			const g$1 = Object.assign(Object.create(r$1), { filePath: e }), h = o$1(g$1);
			if (h instanceof l$1) {
				h.path = e, i$1.push(h);
				continue;
			} else o$1 = h;
		}
		typeof o$1 == "string" ? i$1.push(new y$1(e, o$1)) : i$1.push(new f$1(e), ...w(o$1, e, r$1));
	}
	return i$1;
}, "flattenFileTree");
n$1(async (s$1, t$1) => {
	const r$1 = t$1?.tempDir ? path.resolve(t$1.tempDir) : v, i$1 = path.join(r$1, `${D$1}-${j()}/`);
	if (await a.mkdir(i$1, { recursive: !0 }), s$1) {
		if (typeof s$1 == "string") await a.cp(s$1, i$1, {
			recursive: !0,
			filter: t$1?.templateFilter
		});
		else if (typeof s$1 == "object") {
			const p$1 = {
				fixturePath: i$1,
				getPath: n$1((...e) => path.join(i$1, ...e), "getPath"),
				symlink: n$1((e, o$1) => new l$1(e, o$1), "symlink")
			};
			await Promise.all(w(s$1, i$1, p$1).map(async (e) => {
				e instanceof f$1 ? await a.mkdir(e.path, { recursive: !0 }) : e instanceof l$1 ? (await a.mkdir(path.dirname(e.path), { recursive: !0 }), await a.symlink(e.target, e.path, e.type)) : e instanceof y$1 && (await a.mkdir(path.dirname(e.path), { recursive: !0 }), await a.writeFile(e.path, e.content));
			}));
		}
	}
	return new P(i$1);
}, "createFixture");
var __require = /* @__PURE__ */ createRequire(import.meta.url);
function cleanPath(path$1) {
	let normalized = normalize(path$1);
	if (normalized.length > 1 && normalized[normalized.length - 1] === sep) normalized = normalized.substring(0, normalized.length - 1);
	return normalized;
}
const SLASHES_REGEX = /[\\/]/g;
function convertSlashes(path$1, separator) {
	return path$1.replace(SLASHES_REGEX, separator);
}
const WINDOWS_ROOT_DIR_REGEX = /^[a-z]:[\\/]$/i;
function isRootDirectory(path$1) {
	return path$1 === "/" || WINDOWS_ROOT_DIR_REGEX.test(path$1);
}
function normalizePath(path$1, options) {
	const { resolvePaths, normalizePath: normalizePath$1, pathSeparator } = options;
	const pathNeedsCleaning = process.platform === "win32" && path$1.includes("/") || path$1.startsWith(".");
	if (resolvePaths) path$1 = resolve(path$1);
	if (normalizePath$1 || pathNeedsCleaning) path$1 = cleanPath(path$1);
	if (path$1 === ".") return "";
	return convertSlashes(path$1[path$1.length - 1] !== pathSeparator ? path$1 + pathSeparator : path$1, pathSeparator);
}
function joinPathWithBasePath(filename, directoryPath) {
	return directoryPath + filename;
}
function joinPathWithRelativePath(root, options) {
	return function(filename, directoryPath) {
		if (directoryPath.startsWith(root)) return directoryPath.slice(root.length) + filename;
		else return convertSlashes(relative(root, directoryPath), options.pathSeparator) + options.pathSeparator + filename;
	};
}
function joinPath(filename) {
	return filename;
}
function joinDirectoryPath(filename, directoryPath, separator) {
	return directoryPath + filename + separator;
}
function build$7(root, options) {
	const { relativePaths, includeBasePath } = options;
	return relativePaths && root ? joinPathWithRelativePath(root, options) : includeBasePath ? joinPathWithBasePath : joinPath;
}
function pushDirectoryWithRelativePath(root) {
	return function(directoryPath, paths) {
		paths.push(directoryPath.substring(root.length) || ".");
	};
}
function pushDirectoryFilterWithRelativePath(root) {
	return function(directoryPath, paths, filters) {
		const relativePath = directoryPath.substring(root.length) || ".";
		if (filters.every((filter) => filter(relativePath, true))) paths.push(relativePath);
	};
}
const pushDirectory = (directoryPath, paths) => {
	paths.push(directoryPath || ".");
};
const pushDirectoryFilter = (directoryPath, paths, filters) => {
	const path$1 = directoryPath || ".";
	if (filters.every((filter) => filter(path$1, true))) paths.push(path$1);
};
const empty$2 = () => {};
function build$6(root, options) {
	const { includeDirs, filters, relativePaths } = options;
	if (!includeDirs) return empty$2;
	if (relativePaths) return filters && filters.length ? pushDirectoryFilterWithRelativePath(root) : pushDirectoryWithRelativePath(root);
	return filters && filters.length ? pushDirectoryFilter : pushDirectory;
}
const pushFileFilterAndCount = (filename, _paths, counts, filters) => {
	if (filters.every((filter) => filter(filename, false))) counts.files++;
};
const pushFileFilter = (filename, paths, _counts, filters) => {
	if (filters.every((filter) => filter(filename, false))) paths.push(filename);
};
const pushFileCount = (_filename, _paths, counts, _filters) => {
	counts.files++;
};
const pushFile = (filename, paths) => {
	paths.push(filename);
};
const empty$1 = () => {};
function build$5(options) {
	const { excludeFiles, filters, onlyCounts } = options;
	if (excludeFiles) return empty$1;
	if (filters && filters.length) return onlyCounts ? pushFileFilterAndCount : pushFileFilter;
	else if (onlyCounts) return pushFileCount;
	else return pushFile;
}
const getArray = (paths) => {
	return paths;
};
const getArrayGroup = () => {
	return [""].slice(0, 0);
};
function build$4(options) {
	return options.group ? getArrayGroup : getArray;
}
const groupFiles = (groups, directory, files) => {
	groups.push({
		directory,
		files,
		dir: directory
	});
};
const empty = () => {};
function build$3(options) {
	return options.group ? groupFiles : empty;
}
const resolveSymlinksAsync = function(path$1, state, callback$1) {
	const { queue: queue$1, fs, options: { suppressErrors } } = state;
	queue$1.enqueue();
	fs.realpath(path$1, (error, resolvedPath) => {
		if (error) return queue$1.dequeue(suppressErrors ? null : error, state);
		fs.stat(resolvedPath, (error$1, stat$1) => {
			if (error$1) return queue$1.dequeue(suppressErrors ? null : error$1, state);
			if (stat$1.isDirectory() && isRecursive(path$1, resolvedPath, state)) return queue$1.dequeue(null, state);
			callback$1(stat$1, resolvedPath);
			queue$1.dequeue(null, state);
		});
	});
};
const resolveSymlinks = function(path$1, state, callback$1) {
	const { queue: queue$1, fs, options: { suppressErrors } } = state;
	queue$1.enqueue();
	try {
		const resolvedPath = fs.realpathSync(path$1);
		const stat$1 = fs.statSync(resolvedPath);
		if (stat$1.isDirectory() && isRecursive(path$1, resolvedPath, state)) return;
		callback$1(stat$1, resolvedPath);
	} catch (e) {
		if (!suppressErrors) throw e;
	}
};
function build$2(options, isSynchronous) {
	if (!options.resolveSymlinks || options.excludeSymlinks) return null;
	return isSynchronous ? resolveSymlinks : resolveSymlinksAsync;
}
function isRecursive(path$1, resolved, state) {
	if (state.options.useRealPaths) return isRecursiveUsingRealPaths(resolved, state);
	let parent = dirname(path$1);
	let depth$1 = 1;
	while (parent !== state.root && depth$1 < 2) {
		const resolvedPath = state.symlinks.get(parent);
		if (!!resolvedPath && (resolvedPath === resolved || resolvedPath.startsWith(resolved) || resolved.startsWith(resolvedPath))) depth$1++;
		else parent = dirname(parent);
	}
	state.symlinks.set(path$1, resolved);
	return depth$1 > 1;
}
function isRecursiveUsingRealPaths(resolved, state) {
	return state.visited.includes(resolved + state.options.pathSeparator);
}
const onlyCountsSync = (state) => {
	return state.counts;
};
const groupsSync = (state) => {
	return state.groups;
};
const defaultSync = (state) => {
	return state.paths;
};
const limitFilesSync = (state) => {
	return state.paths.slice(0, state.options.maxFiles);
};
const onlyCountsAsync = (state, error, callback$1) => {
	report(error, callback$1, state.counts, state.options.suppressErrors);
	return null;
};
const defaultAsync = (state, error, callback$1) => {
	report(error, callback$1, state.paths, state.options.suppressErrors);
	return null;
};
const limitFilesAsync = (state, error, callback$1) => {
	report(error, callback$1, state.paths.slice(0, state.options.maxFiles), state.options.suppressErrors);
	return null;
};
const groupsAsync = (state, error, callback$1) => {
	report(error, callback$1, state.groups, state.options.suppressErrors);
	return null;
};
function report(error, callback$1, output, suppressErrors) {
	if (error && !suppressErrors) callback$1(error, output);
	else callback$1(null, output);
}
function build$1(options, isSynchronous) {
	const { onlyCounts, group, maxFiles } = options;
	if (onlyCounts) return isSynchronous ? onlyCountsSync : onlyCountsAsync;
	else if (group) return isSynchronous ? groupsSync : groupsAsync;
	else if (maxFiles) return isSynchronous ? limitFilesSync : limitFilesAsync;
	else return isSynchronous ? defaultSync : defaultAsync;
}
const readdirOpts = { withFileTypes: true };
const walkAsync = (state, crawlPath, directoryPath, currentDepth, callback$1) => {
	state.queue.enqueue();
	if (currentDepth < 0) return state.queue.dequeue(null, state);
	const { fs } = state;
	state.visited.push(crawlPath);
	state.counts.directories++;
	fs.readdir(crawlPath || ".", readdirOpts, (error, entries = []) => {
		callback$1(entries, directoryPath, currentDepth);
		state.queue.dequeue(state.options.suppressErrors ? null : error, state);
	});
};
const walkSync = (state, crawlPath, directoryPath, currentDepth, callback$1) => {
	const { fs } = state;
	if (currentDepth < 0) return;
	state.visited.push(crawlPath);
	state.counts.directories++;
	let entries = [];
	try {
		entries = fs.readdirSync(crawlPath || ".", readdirOpts);
	} catch (e) {
		if (!state.options.suppressErrors) throw e;
	}
	callback$1(entries, directoryPath, currentDepth);
};
function build(isSynchronous) {
	return isSynchronous ? walkSync : walkAsync;
}
var Queue = class {
	count = 0;
	constructor(onQueueEmpty) {
		this.onQueueEmpty = onQueueEmpty;
	}
	enqueue() {
		this.count++;
		return this.count;
	}
	dequeue(error, output) {
		if (this.onQueueEmpty && (--this.count <= 0 || error)) {
			this.onQueueEmpty(error, output);
			if (error) {
				output.controller.abort();
				this.onQueueEmpty = void 0;
			}
		}
	}
};
var Counter = class {
	_files = 0;
	_directories = 0;
	set files(num) {
		this._files = num;
	}
	get files() {
		return this._files;
	}
	set directories(num) {
		this._directories = num;
	}
	get directories() {
		return this._directories;
	}
	/* c8 ignore next 3 */
	get dirs() {
		return this._directories;
	}
};
var Aborter = class {
	aborted = false;
	abort() {
		this.aborted = true;
	}
};
var Walker = class {
	root;
	isSynchronous;
	state;
	joinPath;
	pushDirectory;
	pushFile;
	getArray;
	groupFiles;
	resolveSymlink;
	walkDirectory;
	callbackInvoker;
	constructor(root, options, callback$1) {
		this.isSynchronous = !callback$1;
		this.callbackInvoker = build$1(options, this.isSynchronous);
		this.root = normalizePath(root, options);
		this.state = {
			root: isRootDirectory(this.root) ? this.root : this.root.slice(0, -1),
			paths: [""].slice(0, 0),
			groups: [],
			counts: new Counter(),
			options,
			queue: new Queue((error, state) => this.callbackInvoker(state, error, callback$1)),
			symlinks: /* @__PURE__ */ new Map(),
			visited: [""].slice(0, 0),
			controller: new Aborter(),
			fs: options.fs || nativeFs
		};
		this.joinPath = build$7(this.root, options);
		this.pushDirectory = build$6(this.root, options);
		this.pushFile = build$5(options);
		this.getArray = build$4(options);
		this.groupFiles = build$3(options);
		this.resolveSymlink = build$2(options, this.isSynchronous);
		this.walkDirectory = build(this.isSynchronous);
	}
	start() {
		this.pushDirectory(this.root, this.state.paths, this.state.options.filters);
		this.walkDirectory(this.state, this.root, this.root, this.state.options.maxDepth, this.walk);
		return this.isSynchronous ? this.callbackInvoker(this.state, null) : null;
	}
	walk = (entries, directoryPath, depth$1) => {
		const { paths, options: { filters, resolveSymlinks: resolveSymlinks$1, excludeSymlinks, exclude, maxFiles, signal, useRealPaths, pathSeparator }, controller } = this.state;
		if (controller.aborted || signal && signal.aborted || maxFiles && paths.length > maxFiles) return;
		const files = this.getArray(this.state.paths);
		for (let i$1 = 0; i$1 < entries.length; ++i$1) {
			const entry = entries[i$1];
			if (entry.isFile() || entry.isSymbolicLink() && !resolveSymlinks$1 && !excludeSymlinks) {
				const filename = this.joinPath(entry.name, directoryPath);
				this.pushFile(filename, files, this.state.counts, filters);
			} else if (entry.isDirectory()) {
				let path$1 = joinDirectoryPath(entry.name, directoryPath, this.state.options.pathSeparator);
				if (exclude && exclude(entry.name, path$1)) continue;
				this.pushDirectory(path$1, paths, filters);
				this.walkDirectory(this.state, path$1, path$1, depth$1 - 1, this.walk);
			} else if (this.resolveSymlink && entry.isSymbolicLink()) {
				let path$1 = joinPathWithBasePath(entry.name, directoryPath);
				this.resolveSymlink(path$1, this.state, (stat$1, resolvedPath) => {
					if (stat$1.isDirectory()) {
						resolvedPath = normalizePath(resolvedPath, this.state.options);
						if (exclude && exclude(entry.name, useRealPaths ? resolvedPath : path$1 + pathSeparator)) return;
						this.walkDirectory(this.state, resolvedPath, useRealPaths ? resolvedPath : path$1 + pathSeparator, depth$1 - 1, this.walk);
					} else {
						resolvedPath = useRealPaths ? resolvedPath : path$1;
						const filename = basename(resolvedPath);
						const directoryPath$1 = normalizePath(dirname(resolvedPath), this.state.options);
						resolvedPath = this.joinPath(filename, directoryPath$1);
						this.pushFile(resolvedPath, files, this.state.counts, filters);
					}
				});
			}
		}
		this.groupFiles(this.state.groups, directoryPath, files);
	};
};
function promise(root, options) {
	return new Promise((resolve$1, reject) => {
		callback(root, options, (err, output) => {
			if (err) return reject(err);
			resolve$1(output);
		});
	});
}
function callback(root, options, callback$1) {
	new Walker(root, options, callback$1).start();
}
function sync(root, options) {
	return new Walker(root, options).start();
}
var APIBuilder = class {
	constructor(root, options) {
		this.root = root;
		this.options = options;
	}
	withPromise() {
		return promise(this.root, this.options);
	}
	withCallback(cb) {
		callback(this.root, this.options, cb);
	}
	sync() {
		return sync(this.root, this.options);
	}
};
let pm = null;
/* c8 ignore next 6 */
try {
	__require.resolve("picomatch");
	pm = __require("picomatch");
} catch {}
var Builder = class {
	globCache = {};
	options = {
		maxDepth: Infinity,
		suppressErrors: true,
		pathSeparator: sep,
		filters: []
	};
	globFunction;
	constructor(options) {
		this.options = {
			...this.options,
			...options
		};
		this.globFunction = this.options.globFunction;
	}
	group() {
		this.options.group = true;
		return this;
	}
	withPathSeparator(separator) {
		this.options.pathSeparator = separator;
		return this;
	}
	withBasePath() {
		this.options.includeBasePath = true;
		return this;
	}
	withRelativePaths() {
		this.options.relativePaths = true;
		return this;
	}
	withDirs() {
		this.options.includeDirs = true;
		return this;
	}
	withMaxDepth(depth$1) {
		this.options.maxDepth = depth$1;
		return this;
	}
	withMaxFiles(limit) {
		this.options.maxFiles = limit;
		return this;
	}
	withFullPaths() {
		this.options.resolvePaths = true;
		this.options.includeBasePath = true;
		return this;
	}
	withErrors() {
		this.options.suppressErrors = false;
		return this;
	}
	withSymlinks({ resolvePaths = true } = {}) {
		this.options.resolveSymlinks = true;
		this.options.useRealPaths = resolvePaths;
		return this.withFullPaths();
	}
	withAbortSignal(signal) {
		this.options.signal = signal;
		return this;
	}
	normalize() {
		this.options.normalizePath = true;
		return this;
	}
	filter(predicate) {
		this.options.filters.push(predicate);
		return this;
	}
	onlyDirs() {
		this.options.excludeFiles = true;
		this.options.includeDirs = true;
		return this;
	}
	exclude(predicate) {
		this.options.exclude = predicate;
		return this;
	}
	onlyCounts() {
		this.options.onlyCounts = true;
		return this;
	}
	crawl(root) {
		return new APIBuilder(root || ".", this.options);
	}
	withGlobFunction(fn) {
		this.globFunction = fn;
		return this;
	}
	/* c8 ignore next 4 */
	crawlWithOptions(root, options) {
		this.options = {
			...this.options,
			...options
		};
		return new APIBuilder(root || ".", this.options);
	}
	glob(...patterns) {
		if (this.globFunction) return this.globWithOptions(patterns);
		return this.globWithOptions(patterns, ...[{ dot: true }]);
	}
	globWithOptions(patterns, ...options) {
		const globFn = this.globFunction || pm;
		/* c8 ignore next 5 */
		if (!globFn) throw new Error("Please specify a glob function to use glob matching.");
		var isMatch = this.globCache[patterns.join("\0")];
		if (!isMatch) {
			isMatch = globFn(patterns, ...options);
			this.globCache[patterns.join("\0")] = isMatch;
		}
		this.options.filters.push((path$1) => isMatch(path$1));
		return this;
	}
};
var require_constants = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const WIN_SLASH = "\\\\/";
	const WIN_NO_SLASH = `[^${WIN_SLASH}]`;
	const DOT_LITERAL = "\\.";
	const PLUS_LITERAL = "\\+";
	const QMARK_LITERAL = "\\?";
	const SLASH_LITERAL = "\\/";
	const ONE_CHAR = "(?=.)";
	const QMARK = "[^/]";
	const END_ANCHOR = `(?:${SLASH_LITERAL}|$)`;
	const START_ANCHOR = `(?:^|${SLASH_LITERAL})`;
	const DOTS_SLASH = `${DOT_LITERAL}{1,2}${END_ANCHOR}`;
	const POSIX_CHARS = {
		DOT_LITERAL,
		PLUS_LITERAL,
		QMARK_LITERAL,
		SLASH_LITERAL,
		ONE_CHAR,
		QMARK,
		END_ANCHOR,
		DOTS_SLASH,
		NO_DOT: `(?!${DOT_LITERAL})`,
		NO_DOTS: `(?!${START_ANCHOR}${DOTS_SLASH})`,
		NO_DOT_SLASH: `(?!${DOT_LITERAL}{0,1}${END_ANCHOR})`,
		NO_DOTS_SLASH: `(?!${DOTS_SLASH})`,
		QMARK_NO_DOT: `[^.${SLASH_LITERAL}]`,
		STAR: `${QMARK}*?`,
		START_ANCHOR,
		SEP: "/"
	};
	const WINDOWS_CHARS = {
		...POSIX_CHARS,
		SLASH_LITERAL: `[${WIN_SLASH}]`,
		QMARK: WIN_NO_SLASH,
		STAR: `${WIN_NO_SLASH}*?`,
		DOTS_SLASH: `${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$)`,
		NO_DOT: `(?!${DOT_LITERAL})`,
		NO_DOTS: `(?!(?:^|[${WIN_SLASH}])${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$))`,
		NO_DOT_SLASH: `(?!${DOT_LITERAL}{0,1}(?:[${WIN_SLASH}]|$))`,
		NO_DOTS_SLASH: `(?!${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$))`,
		QMARK_NO_DOT: `[^.${WIN_SLASH}]`,
		START_ANCHOR: `(?:^|[${WIN_SLASH}])`,
		END_ANCHOR: `(?:[${WIN_SLASH}]|$)`,
		SEP: "\\"
	};
	module.exports = {
		MAX_LENGTH: 1024 * 64,
		POSIX_REGEX_SOURCE: {
			alnum: "a-zA-Z0-9",
			alpha: "a-zA-Z",
			ascii: "\\x00-\\x7F",
			blank: " \\t",
			cntrl: "\\x00-\\x1F\\x7F",
			digit: "0-9",
			graph: "\\x21-\\x7E",
			lower: "a-z",
			print: "\\x20-\\x7E ",
			punct: "\\-!\"#$%&'()\\*+,./:;<=>?@[\\]^_`{|}~",
			space: " \\t\\r\\n\\v\\f",
			upper: "A-Z",
			word: "A-Za-z0-9_",
			xdigit: "A-Fa-f0-9"
		},
		REGEX_BACKSLASH: /\\(?![*+?^${}(|)[\]])/g,
		REGEX_NON_SPECIAL_CHARS: /^[^@![\].,$*+?^{}()|\\/]+/,
		REGEX_SPECIAL_CHARS: /[-*+?.^${}(|)[\]]/,
		REGEX_SPECIAL_CHARS_BACKREF: /(\\?)((\W)(\3*))/g,
		REGEX_SPECIAL_CHARS_GLOBAL: /([-*+?.^${}(|)[\]])/g,
		REGEX_REMOVE_BACKSLASH: /(?:\[.*?[^\\]\]|\\(?=.))/g,
		REPLACEMENTS: {
			__proto__: null,
			"***": "*",
			"**/**": "**",
			"**/**/**": "**"
		},
		CHAR_0: 48,
		CHAR_9: 57,
		CHAR_UPPERCASE_A: 65,
		CHAR_LOWERCASE_A: 97,
		CHAR_UPPERCASE_Z: 90,
		CHAR_LOWERCASE_Z: 122,
		CHAR_LEFT_PARENTHESES: 40,
		CHAR_RIGHT_PARENTHESES: 41,
		CHAR_ASTERISK: 42,
		CHAR_AMPERSAND: 38,
		CHAR_AT: 64,
		CHAR_BACKWARD_SLASH: 92,
		CHAR_CARRIAGE_RETURN: 13,
		CHAR_CIRCUMFLEX_ACCENT: 94,
		CHAR_COLON: 58,
		CHAR_COMMA: 44,
		CHAR_DOT: 46,
		CHAR_DOUBLE_QUOTE: 34,
		CHAR_EQUAL: 61,
		CHAR_EXCLAMATION_MARK: 33,
		CHAR_FORM_FEED: 12,
		CHAR_FORWARD_SLASH: 47,
		CHAR_GRAVE_ACCENT: 96,
		CHAR_HASH: 35,
		CHAR_HYPHEN_MINUS: 45,
		CHAR_LEFT_ANGLE_BRACKET: 60,
		CHAR_LEFT_CURLY_BRACE: 123,
		CHAR_LEFT_SQUARE_BRACKET: 91,
		CHAR_LINE_FEED: 10,
		CHAR_NO_BREAK_SPACE: 160,
		CHAR_PERCENT: 37,
		CHAR_PLUS: 43,
		CHAR_QUESTION_MARK: 63,
		CHAR_RIGHT_ANGLE_BRACKET: 62,
		CHAR_RIGHT_CURLY_BRACE: 125,
		CHAR_RIGHT_SQUARE_BRACKET: 93,
		CHAR_SEMICOLON: 59,
		CHAR_SINGLE_QUOTE: 39,
		CHAR_SPACE: 32,
		CHAR_TAB: 9,
		CHAR_UNDERSCORE: 95,
		CHAR_VERTICAL_LINE: 124,
		CHAR_ZERO_WIDTH_NOBREAK_SPACE: 65279,
		extglobChars(chars) {
			return {
				"!": {
					type: "negate",
					open: "(?:(?!(?:",
					close: `))${chars.STAR})`
				},
				"?": {
					type: "qmark",
					open: "(?:",
					close: ")?"
				},
				"+": {
					type: "plus",
					open: "(?:",
					close: ")+"
				},
				"*": {
					type: "star",
					open: "(?:",
					close: ")*"
				},
				"@": {
					type: "at",
					open: "(?:",
					close: ")"
				}
			};
		},
		globChars(win32) {
			return win32 === true ? WINDOWS_CHARS : POSIX_CHARS;
		}
	};
}));
var require_utils = /* @__PURE__ */ __commonJSMin(((exports) => {
	const { REGEX_BACKSLASH, REGEX_REMOVE_BACKSLASH, REGEX_SPECIAL_CHARS, REGEX_SPECIAL_CHARS_GLOBAL } = require_constants();
	exports.isObject = (val) => val !== null && typeof val === "object" && !Array.isArray(val);
	exports.hasRegexChars = (str) => REGEX_SPECIAL_CHARS.test(str);
	exports.isRegexChar = (str) => str.length === 1 && exports.hasRegexChars(str);
	exports.escapeRegex = (str) => str.replace(REGEX_SPECIAL_CHARS_GLOBAL, "\\$1");
	exports.toPosixSlashes = (str) => str.replace(REGEX_BACKSLASH, "/");
	exports.isWindows = () => {
		if (typeof navigator !== "undefined" && navigator.platform) {
			const platform$1 = navigator.platform.toLowerCase();
			return platform$1 === "win32" || platform$1 === "windows";
		}
		if (typeof process !== "undefined" && process.platform) return process.platform === "win32";
		return false;
	};
	exports.removeBackslashes = (str) => {
		return str.replace(REGEX_REMOVE_BACKSLASH, (match) => {
			return match === "\\" ? "" : match;
		});
	};
	exports.escapeLast = (input, char, lastIdx) => {
		const idx = input.lastIndexOf(char, lastIdx);
		if (idx === -1) return input;
		if (input[idx - 1] === "\\") return exports.escapeLast(input, char, idx - 1);
		return `${input.slice(0, idx)}\\${input.slice(idx)}`;
	};
	exports.removePrefix = (input, state = {}) => {
		let output = input;
		if (output.startsWith("./")) {
			output = output.slice(2);
			state.prefix = "./";
		}
		return output;
	};
	exports.wrapOutput = (input, state = {}, options = {}) => {
		let output = `${options.contains ? "" : "^"}(?:${input})${options.contains ? "" : "$"}`;
		if (state.negated === true) output = `(?:^(?!${output}).*$)`;
		return output;
	};
	exports.basename = (path$1, { windows } = {}) => {
		const segs = path$1.split(windows ? /[\\/]/ : "/");
		const last = segs[segs.length - 1];
		if (last === "") return segs[segs.length - 2];
		return last;
	};
}));
var require_scan = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const utils$3 = require_utils();
	const { CHAR_ASTERISK, CHAR_AT, CHAR_BACKWARD_SLASH, CHAR_COMMA, CHAR_DOT, CHAR_EXCLAMATION_MARK, CHAR_FORWARD_SLASH, CHAR_LEFT_CURLY_BRACE, CHAR_LEFT_PARENTHESES, CHAR_LEFT_SQUARE_BRACKET, CHAR_PLUS, CHAR_QUESTION_MARK, CHAR_RIGHT_CURLY_BRACE, CHAR_RIGHT_PARENTHESES, CHAR_RIGHT_SQUARE_BRACKET } = require_constants();
	const isPathSeparator = (code) => {
		return code === CHAR_FORWARD_SLASH || code === CHAR_BACKWARD_SLASH;
	};
	const depth = (token) => {
		if (token.isPrefix !== true) token.depth = token.isGlobstar ? Infinity : 1;
	};
	const scan$1 = (input, options) => {
		const opts = options || {};
		const length = input.length - 1;
		const scanToEnd = opts.parts === true || opts.scanToEnd === true;
		const slashes = [];
		const tokens = [];
		const parts = [];
		let str = input;
		let index = -1;
		let start = 0;
		let lastIndex = 0;
		let isBrace = false;
		let isBracket = false;
		let isGlob = false;
		let isExtglob = false;
		let isGlobstar = false;
		let braceEscaped = false;
		let backslashes = false;
		let negated = false;
		let negatedExtglob = false;
		let finished = false;
		let braces = 0;
		let prev;
		let code;
		let token = {
			value: "",
			depth: 0,
			isGlob: false
		};
		const eos = () => index >= length;
		const peek = () => str.charCodeAt(index + 1);
		const advance = () => {
			prev = code;
			return str.charCodeAt(++index);
		};
		while (index < length) {
			code = advance();
			let next;
			if (code === CHAR_BACKWARD_SLASH) {
				backslashes = token.backslashes = true;
				code = advance();
				if (code === CHAR_LEFT_CURLY_BRACE) braceEscaped = true;
				continue;
			}
			if (braceEscaped === true || code === CHAR_LEFT_CURLY_BRACE) {
				braces++;
				while (eos() !== true && (code = advance())) {
					if (code === CHAR_BACKWARD_SLASH) {
						backslashes = token.backslashes = true;
						advance();
						continue;
					}
					if (code === CHAR_LEFT_CURLY_BRACE) {
						braces++;
						continue;
					}
					if (braceEscaped !== true && code === CHAR_DOT && (code = advance()) === CHAR_DOT) {
						isBrace = token.isBrace = true;
						isGlob = token.isGlob = true;
						finished = true;
						if (scanToEnd === true) continue;
						break;
					}
					if (braceEscaped !== true && code === CHAR_COMMA) {
						isBrace = token.isBrace = true;
						isGlob = token.isGlob = true;
						finished = true;
						if (scanToEnd === true) continue;
						break;
					}
					if (code === CHAR_RIGHT_CURLY_BRACE) {
						braces--;
						if (braces === 0) {
							braceEscaped = false;
							isBrace = token.isBrace = true;
							finished = true;
							break;
						}
					}
				}
				if (scanToEnd === true) continue;
				break;
			}
			if (code === CHAR_FORWARD_SLASH) {
				slashes.push(index);
				tokens.push(token);
				token = {
					value: "",
					depth: 0,
					isGlob: false
				};
				if (finished === true) continue;
				if (prev === CHAR_DOT && index === start + 1) {
					start += 2;
					continue;
				}
				lastIndex = index + 1;
				continue;
			}
			if (opts.noext !== true) {
				if ((code === CHAR_PLUS || code === CHAR_AT || code === CHAR_ASTERISK || code === CHAR_QUESTION_MARK || code === CHAR_EXCLAMATION_MARK) === true && peek() === CHAR_LEFT_PARENTHESES) {
					isGlob = token.isGlob = true;
					isExtglob = token.isExtglob = true;
					finished = true;
					if (code === CHAR_EXCLAMATION_MARK && index === start) negatedExtglob = true;
					if (scanToEnd === true) {
						while (eos() !== true && (code = advance())) {
							if (code === CHAR_BACKWARD_SLASH) {
								backslashes = token.backslashes = true;
								code = advance();
								continue;
							}
							if (code === CHAR_RIGHT_PARENTHESES) {
								isGlob = token.isGlob = true;
								finished = true;
								break;
							}
						}
						continue;
					}
					break;
				}
			}
			if (code === CHAR_ASTERISK) {
				if (prev === CHAR_ASTERISK) isGlobstar = token.isGlobstar = true;
				isGlob = token.isGlob = true;
				finished = true;
				if (scanToEnd === true) continue;
				break;
			}
			if (code === CHAR_QUESTION_MARK) {
				isGlob = token.isGlob = true;
				finished = true;
				if (scanToEnd === true) continue;
				break;
			}
			if (code === CHAR_LEFT_SQUARE_BRACKET) {
				while (eos() !== true && (next = advance())) {
					if (next === CHAR_BACKWARD_SLASH) {
						backslashes = token.backslashes = true;
						advance();
						continue;
					}
					if (next === CHAR_RIGHT_SQUARE_BRACKET) {
						isBracket = token.isBracket = true;
						isGlob = token.isGlob = true;
						finished = true;
						break;
					}
				}
				if (scanToEnd === true) continue;
				break;
			}
			if (opts.nonegate !== true && code === CHAR_EXCLAMATION_MARK && index === start) {
				negated = token.negated = true;
				start++;
				continue;
			}
			if (opts.noparen !== true && code === CHAR_LEFT_PARENTHESES) {
				isGlob = token.isGlob = true;
				if (scanToEnd === true) {
					while (eos() !== true && (code = advance())) {
						if (code === CHAR_LEFT_PARENTHESES) {
							backslashes = token.backslashes = true;
							code = advance();
							continue;
						}
						if (code === CHAR_RIGHT_PARENTHESES) {
							finished = true;
							break;
						}
					}
					continue;
				}
				break;
			}
			if (isGlob === true) {
				finished = true;
				if (scanToEnd === true) continue;
				break;
			}
		}
		if (opts.noext === true) {
			isExtglob = false;
			isGlob = false;
		}
		let base = str;
		let prefix = "";
		let glob$1 = "";
		if (start > 0) {
			prefix = str.slice(0, start);
			str = str.slice(start);
			lastIndex -= start;
		}
		if (base && isGlob === true && lastIndex > 0) {
			base = str.slice(0, lastIndex);
			glob$1 = str.slice(lastIndex);
		} else if (isGlob === true) {
			base = "";
			glob$1 = str;
		} else base = str;
		if (base && base !== "" && base !== "/" && base !== str) {
			if (isPathSeparator(base.charCodeAt(base.length - 1))) base = base.slice(0, -1);
		}
		if (opts.unescape === true) {
			if (glob$1) glob$1 = utils$3.removeBackslashes(glob$1);
			if (base && backslashes === true) base = utils$3.removeBackslashes(base);
		}
		const state = {
			prefix,
			input,
			start,
			base,
			glob: glob$1,
			isBrace,
			isBracket,
			isGlob,
			isExtglob,
			isGlobstar,
			negated,
			negatedExtglob
		};
		if (opts.tokens === true) {
			state.maxDepth = 0;
			if (!isPathSeparator(code)) tokens.push(token);
			state.tokens = tokens;
		}
		if (opts.parts === true || opts.tokens === true) {
			let prevIndex;
			for (let idx = 0; idx < slashes.length; idx++) {
				const n$2 = prevIndex ? prevIndex + 1 : start;
				const i$1 = slashes[idx];
				const value = input.slice(n$2, i$1);
				if (opts.tokens) {
					if (idx === 0 && start !== 0) {
						tokens[idx].isPrefix = true;
						tokens[idx].value = prefix;
					} else tokens[idx].value = value;
					depth(tokens[idx]);
					state.maxDepth += tokens[idx].depth;
				}
				if (idx !== 0 || value !== "") parts.push(value);
				prevIndex = i$1;
			}
			if (prevIndex && prevIndex + 1 < input.length) {
				const value = input.slice(prevIndex + 1);
				parts.push(value);
				if (opts.tokens) {
					tokens[tokens.length - 1].value = value;
					depth(tokens[tokens.length - 1]);
					state.maxDepth += tokens[tokens.length - 1].depth;
				}
			}
			state.slashes = slashes;
			state.parts = parts;
		}
		return state;
	};
	module.exports = scan$1;
}));
var require_parse = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const constants$1 = require_constants();
	const utils$2 = require_utils();
	const { MAX_LENGTH, POSIX_REGEX_SOURCE, REGEX_NON_SPECIAL_CHARS, REGEX_SPECIAL_CHARS_BACKREF, REPLACEMENTS } = constants$1;
	const expandRange = (args, options) => {
		if (typeof options.expandRange === "function") return options.expandRange(...args, options);
		args.sort();
		const value = `[${args.join("-")}]`;
		try {
			new RegExp(value);
		} catch (ex) {
			return args.map((v$1) => utils$2.escapeRegex(v$1)).join("..");
		}
		return value;
	};
	const syntaxError = (type, char) => {
		return `Missing ${type}: "${char}" - use "\\\\${char}" to match literal characters`;
	};
	const parse$1 = (input, options) => {
		if (typeof input !== "string") throw new TypeError("Expected a string");
		input = REPLACEMENTS[input] || input;
		const opts = { ...options };
		const max = typeof opts.maxLength === "number" ? Math.min(MAX_LENGTH, opts.maxLength) : MAX_LENGTH;
		let len = input.length;
		if (len > max) throw new SyntaxError(`Input length: ${len}, exceeds maximum allowed length: ${max}`);
		const bos = {
			type: "bos",
			value: "",
			output: opts.prepend || ""
		};
		const tokens = [bos];
		const capture = opts.capture ? "" : "?:";
		const PLATFORM_CHARS = constants$1.globChars(opts.windows);
		const EXTGLOB_CHARS = constants$1.extglobChars(PLATFORM_CHARS);
		const { DOT_LITERAL: DOT_LITERAL$1, PLUS_LITERAL: PLUS_LITERAL$1, SLASH_LITERAL: SLASH_LITERAL$1, ONE_CHAR: ONE_CHAR$1, DOTS_SLASH: DOTS_SLASH$1, NO_DOT, NO_DOT_SLASH, NO_DOTS_SLASH, QMARK: QMARK$1, QMARK_NO_DOT, STAR, START_ANCHOR: START_ANCHOR$1 } = PLATFORM_CHARS;
		const globstar = (opts$1) => {
			return `(${capture}(?:(?!${START_ANCHOR$1}${opts$1.dot ? DOTS_SLASH$1 : DOT_LITERAL$1}).)*?)`;
		};
		const nodot = opts.dot ? "" : NO_DOT;
		const qmarkNoDot = opts.dot ? QMARK$1 : QMARK_NO_DOT;
		let star = opts.bash === true ? globstar(opts) : STAR;
		if (opts.capture) star = `(${star})`;
		if (typeof opts.noext === "boolean") opts.noextglob = opts.noext;
		const state = {
			input,
			index: -1,
			start: 0,
			dot: opts.dot === true,
			consumed: "",
			output: "",
			prefix: "",
			backtrack: false,
			negated: false,
			brackets: 0,
			braces: 0,
			parens: 0,
			quotes: 0,
			globstar: false,
			tokens
		};
		input = utils$2.removePrefix(input, state);
		len = input.length;
		const extglobs = [];
		const braces = [];
		const stack = [];
		let prev = bos;
		let value;
		const eos = () => state.index === len - 1;
		const peek = state.peek = (n$2 = 1) => input[state.index + n$2];
		const advance = state.advance = () => input[++state.index] || "";
		const remaining = () => input.slice(state.index + 1);
		const consume = (value$1 = "", num = 0) => {
			state.consumed += value$1;
			state.index += num;
		};
		const append = (token) => {
			state.output += token.output != null ? token.output : token.value;
			consume(token.value);
		};
		const negate = () => {
			let count = 1;
			while (peek() === "!" && (peek(2) !== "(" || peek(3) === "?")) {
				advance();
				state.start++;
				count++;
			}
			if (count % 2 === 0) return false;
			state.negated = true;
			state.start++;
			return true;
		};
		const increment = (type) => {
			state[type]++;
			stack.push(type);
		};
		const decrement = (type) => {
			state[type]--;
			stack.pop();
		};
		const push = (tok) => {
			if (prev.type === "globstar") {
				const isBrace = state.braces > 0 && (tok.type === "comma" || tok.type === "brace");
				const isExtglob = tok.extglob === true || extglobs.length && (tok.type === "pipe" || tok.type === "paren");
				if (tok.type !== "slash" && tok.type !== "paren" && !isBrace && !isExtglob) {
					state.output = state.output.slice(0, -prev.output.length);
					prev.type = "star";
					prev.value = "*";
					prev.output = star;
					state.output += prev.output;
				}
			}
			if (extglobs.length && tok.type !== "paren") extglobs[extglobs.length - 1].inner += tok.value;
			if (tok.value || tok.output) append(tok);
			if (prev && prev.type === "text" && tok.type === "text") {
				prev.output = (prev.output || prev.value) + tok.value;
				prev.value += tok.value;
				return;
			}
			tok.prev = prev;
			tokens.push(tok);
			prev = tok;
		};
		const extglobOpen = (type, value$1) => {
			const token = {
				...EXTGLOB_CHARS[value$1],
				conditions: 1,
				inner: ""
			};
			token.prev = prev;
			token.parens = state.parens;
			token.output = state.output;
			const output = (opts.capture ? "(" : "") + token.open;
			increment("parens");
			push({
				type,
				value: value$1,
				output: state.output ? "" : ONE_CHAR$1
			});
			push({
				type: "paren",
				extglob: true,
				value: advance(),
				output
			});
			extglobs.push(token);
		};
		const extglobClose = (token) => {
			let output = token.close + (opts.capture ? ")" : "");
			let rest;
			if (token.type === "negate") {
				let extglobStar = star;
				if (token.inner && token.inner.length > 1 && token.inner.includes("/")) extglobStar = globstar(opts);
				if (extglobStar !== star || eos() || /^\)+$/.test(remaining())) output = token.close = `)$))${extglobStar}`;
				if (token.inner.includes("*") && (rest = remaining()) && /^\.[^\\/.]+$/.test(rest)) output = token.close = `)${parse$1(rest, {
					...options,
					fastpaths: false
				}).output})${extglobStar})`;
				if (token.prev.type === "bos") state.negatedExtglob = true;
			}
			push({
				type: "paren",
				extglob: true,
				value,
				output
			});
			decrement("parens");
		};
		if (opts.fastpaths !== false && !/(^[*!]|[/()[\]{}"])/.test(input)) {
			let backslashes = false;
			let output = input.replace(REGEX_SPECIAL_CHARS_BACKREF, (m$1, esc, chars, first, rest, index) => {
				if (first === "\\") {
					backslashes = true;
					return m$1;
				}
				if (first === "?") {
					if (esc) return esc + first + (rest ? QMARK$1.repeat(rest.length) : "");
					if (index === 0) return qmarkNoDot + (rest ? QMARK$1.repeat(rest.length) : "");
					return QMARK$1.repeat(chars.length);
				}
				if (first === ".") return DOT_LITERAL$1.repeat(chars.length);
				if (first === "*") {
					if (esc) return esc + first + (rest ? star : "");
					return star;
				}
				return esc ? m$1 : `\\${m$1}`;
			});
			if (backslashes === true) if (opts.unescape === true) output = output.replace(/\\/g, "");
			else output = output.replace(/\\+/g, (m$1) => {
				return m$1.length % 2 === 0 ? "\\\\" : m$1 ? "\\" : "";
			});
			if (output === input && opts.contains === true) {
				state.output = input;
				return state;
			}
			state.output = utils$2.wrapOutput(output, state, options);
			return state;
		}
		while (!eos()) {
			value = advance();
			if (value === "\0") continue;
			if (value === "\\") {
				const next = peek();
				if (next === "/" && opts.bash !== true) continue;
				if (next === "." || next === ";") continue;
				if (!next) {
					value += "\\";
					push({
						type: "text",
						value
					});
					continue;
				}
				const match = /^\\+/.exec(remaining());
				let slashes = 0;
				if (match && match[0].length > 2) {
					slashes = match[0].length;
					state.index += slashes;
					if (slashes % 2 !== 0) value += "\\";
				}
				if (opts.unescape === true) value = advance();
				else value += advance();
				if (state.brackets === 0) {
					push({
						type: "text",
						value
					});
					continue;
				}
			}
			if (state.brackets > 0 && (value !== "]" || prev.value === "[" || prev.value === "[^")) {
				if (opts.posix !== false && value === ":") {
					const inner = prev.value.slice(1);
					if (inner.includes("[")) {
						prev.posix = true;
						if (inner.includes(":")) {
							const idx = prev.value.lastIndexOf("[");
							const pre = prev.value.slice(0, idx);
							const posix$1 = POSIX_REGEX_SOURCE[prev.value.slice(idx + 2)];
							if (posix$1) {
								prev.value = pre + posix$1;
								state.backtrack = true;
								advance();
								if (!bos.output && tokens.indexOf(prev) === 1) bos.output = ONE_CHAR$1;
								continue;
							}
						}
					}
				}
				if (value === "[" && peek() !== ":" || value === "-" && peek() === "]") value = `\\${value}`;
				if (value === "]" && (prev.value === "[" || prev.value === "[^")) value = `\\${value}`;
				if (opts.posix === true && value === "!" && prev.value === "[") value = "^";
				prev.value += value;
				append({ value });
				continue;
			}
			if (state.quotes === 1 && value !== "\"") {
				value = utils$2.escapeRegex(value);
				prev.value += value;
				append({ value });
				continue;
			}
			if (value === "\"") {
				state.quotes = state.quotes === 1 ? 0 : 1;
				if (opts.keepQuotes === true) push({
					type: "text",
					value
				});
				continue;
			}
			if (value === "(") {
				increment("parens");
				push({
					type: "paren",
					value
				});
				continue;
			}
			if (value === ")") {
				if (state.parens === 0 && opts.strictBrackets === true) throw new SyntaxError(syntaxError("opening", "("));
				const extglob = extglobs[extglobs.length - 1];
				if (extglob && state.parens === extglob.parens + 1) {
					extglobClose(extglobs.pop());
					continue;
				}
				push({
					type: "paren",
					value,
					output: state.parens ? ")" : "\\)"
				});
				decrement("parens");
				continue;
			}
			if (value === "[") {
				if (opts.nobracket === true || !remaining().includes("]")) {
					if (opts.nobracket !== true && opts.strictBrackets === true) throw new SyntaxError(syntaxError("closing", "]"));
					value = `\\${value}`;
				} else increment("brackets");
				push({
					type: "bracket",
					value
				});
				continue;
			}
			if (value === "]") {
				if (opts.nobracket === true || prev && prev.type === "bracket" && prev.value.length === 1) {
					push({
						type: "text",
						value,
						output: `\\${value}`
					});
					continue;
				}
				if (state.brackets === 0) {
					if (opts.strictBrackets === true) throw new SyntaxError(syntaxError("opening", "["));
					push({
						type: "text",
						value,
						output: `\\${value}`
					});
					continue;
				}
				decrement("brackets");
				const prevValue = prev.value.slice(1);
				if (prev.posix !== true && prevValue[0] === "^" && !prevValue.includes("/")) value = `/${value}`;
				prev.value += value;
				append({ value });
				if (opts.literalBrackets === false || utils$2.hasRegexChars(prevValue)) continue;
				const escaped = utils$2.escapeRegex(prev.value);
				state.output = state.output.slice(0, -prev.value.length);
				if (opts.literalBrackets === true) {
					state.output += escaped;
					prev.value = escaped;
					continue;
				}
				prev.value = `(${capture}${escaped}|${prev.value})`;
				state.output += prev.value;
				continue;
			}
			if (value === "{" && opts.nobrace !== true) {
				increment("braces");
				const open = {
					type: "brace",
					value,
					output: "(",
					outputIndex: state.output.length,
					tokensIndex: state.tokens.length
				};
				braces.push(open);
				push(open);
				continue;
			}
			if (value === "}") {
				const brace = braces[braces.length - 1];
				if (opts.nobrace === true || !brace) {
					push({
						type: "text",
						value,
						output: value
					});
					continue;
				}
				let output = ")";
				if (brace.dots === true) {
					const arr = tokens.slice();
					const range = [];
					for (let i$1 = arr.length - 1; i$1 >= 0; i$1--) {
						tokens.pop();
						if (arr[i$1].type === "brace") break;
						if (arr[i$1].type !== "dots") range.unshift(arr[i$1].value);
					}
					output = expandRange(range, opts);
					state.backtrack = true;
				}
				if (brace.comma !== true && brace.dots !== true) {
					const out = state.output.slice(0, brace.outputIndex);
					const toks = state.tokens.slice(brace.tokensIndex);
					brace.value = brace.output = "\\{";
					value = output = "\\}";
					state.output = out;
					for (const t$1 of toks) state.output += t$1.output || t$1.value;
				}
				push({
					type: "brace",
					value,
					output
				});
				decrement("braces");
				braces.pop();
				continue;
			}
			if (value === "|") {
				if (extglobs.length > 0) extglobs[extglobs.length - 1].conditions++;
				push({
					type: "text",
					value
				});
				continue;
			}
			if (value === ",") {
				let output = value;
				const brace = braces[braces.length - 1];
				if (brace && stack[stack.length - 1] === "braces") {
					brace.comma = true;
					output = "|";
				}
				push({
					type: "comma",
					value,
					output
				});
				continue;
			}
			if (value === "/") {
				if (prev.type === "dot" && state.index === state.start + 1) {
					state.start = state.index + 1;
					state.consumed = "";
					state.output = "";
					tokens.pop();
					prev = bos;
					continue;
				}
				push({
					type: "slash",
					value,
					output: SLASH_LITERAL$1
				});
				continue;
			}
			if (value === ".") {
				if (state.braces > 0 && prev.type === "dot") {
					if (prev.value === ".") prev.output = DOT_LITERAL$1;
					const brace = braces[braces.length - 1];
					prev.type = "dots";
					prev.output += value;
					prev.value += value;
					brace.dots = true;
					continue;
				}
				if (state.braces + state.parens === 0 && prev.type !== "bos" && prev.type !== "slash") {
					push({
						type: "text",
						value,
						output: DOT_LITERAL$1
					});
					continue;
				}
				push({
					type: "dot",
					value,
					output: DOT_LITERAL$1
				});
				continue;
			}
			if (value === "?") {
				if (!(prev && prev.value === "(") && opts.noextglob !== true && peek() === "(" && peek(2) !== "?") {
					extglobOpen("qmark", value);
					continue;
				}
				if (prev && prev.type === "paren") {
					const next = peek();
					let output = value;
					if (prev.value === "(" && !/[!=<:]/.test(next) || next === "<" && !/<([!=]|\w+>)/.test(remaining())) output = `\\${value}`;
					push({
						type: "text",
						value,
						output
					});
					continue;
				}
				if (opts.dot !== true && (prev.type === "slash" || prev.type === "bos")) {
					push({
						type: "qmark",
						value,
						output: QMARK_NO_DOT
					});
					continue;
				}
				push({
					type: "qmark",
					value,
					output: QMARK$1
				});
				continue;
			}
			if (value === "!") {
				if (opts.noextglob !== true && peek() === "(") {
					if (peek(2) !== "?" || !/[!=<:]/.test(peek(3))) {
						extglobOpen("negate", value);
						continue;
					}
				}
				if (opts.nonegate !== true && state.index === 0) {
					negate();
					continue;
				}
			}
			if (value === "+") {
				if (opts.noextglob !== true && peek() === "(" && peek(2) !== "?") {
					extglobOpen("plus", value);
					continue;
				}
				if (prev && prev.value === "(" || opts.regex === false) {
					push({
						type: "plus",
						value,
						output: PLUS_LITERAL$1
					});
					continue;
				}
				if (prev && (prev.type === "bracket" || prev.type === "paren" || prev.type === "brace") || state.parens > 0) {
					push({
						type: "plus",
						value
					});
					continue;
				}
				push({
					type: "plus",
					value: PLUS_LITERAL$1
				});
				continue;
			}
			if (value === "@") {
				if (opts.noextglob !== true && peek() === "(" && peek(2) !== "?") {
					push({
						type: "at",
						extglob: true,
						value,
						output: ""
					});
					continue;
				}
				push({
					type: "text",
					value
				});
				continue;
			}
			if (value !== "*") {
				if (value === "$" || value === "^") value = `\\${value}`;
				const match = REGEX_NON_SPECIAL_CHARS.exec(remaining());
				if (match) {
					value += match[0];
					state.index += match[0].length;
				}
				push({
					type: "text",
					value
				});
				continue;
			}
			if (prev && (prev.type === "globstar" || prev.star === true)) {
				prev.type = "star";
				prev.star = true;
				prev.value += value;
				prev.output = star;
				state.backtrack = true;
				state.globstar = true;
				consume(value);
				continue;
			}
			let rest = remaining();
			if (opts.noextglob !== true && /^\([^?]/.test(rest)) {
				extglobOpen("star", value);
				continue;
			}
			if (prev.type === "star") {
				if (opts.noglobstar === true) {
					consume(value);
					continue;
				}
				const prior = prev.prev;
				const before = prior.prev;
				const isStart = prior.type === "slash" || prior.type === "bos";
				const afterStar = before && (before.type === "star" || before.type === "globstar");
				if (opts.bash === true && (!isStart || rest[0] && rest[0] !== "/")) {
					push({
						type: "star",
						value,
						output: ""
					});
					continue;
				}
				const isBrace = state.braces > 0 && (prior.type === "comma" || prior.type === "brace");
				const isExtglob = extglobs.length && (prior.type === "pipe" || prior.type === "paren");
				if (!isStart && prior.type !== "paren" && !isBrace && !isExtglob) {
					push({
						type: "star",
						value,
						output: ""
					});
					continue;
				}
				while (rest.slice(0, 3) === "/**") {
					const after = input[state.index + 4];
					if (after && after !== "/") break;
					rest = rest.slice(3);
					consume("/**", 3);
				}
				if (prior.type === "bos" && eos()) {
					prev.type = "globstar";
					prev.value += value;
					prev.output = globstar(opts);
					state.output = prev.output;
					state.globstar = true;
					consume(value);
					continue;
				}
				if (prior.type === "slash" && prior.prev.type !== "bos" && !afterStar && eos()) {
					state.output = state.output.slice(0, -(prior.output + prev.output).length);
					prior.output = `(?:${prior.output}`;
					prev.type = "globstar";
					prev.output = globstar(opts) + (opts.strictSlashes ? ")" : "|$)");
					prev.value += value;
					state.globstar = true;
					state.output += prior.output + prev.output;
					consume(value);
					continue;
				}
				if (prior.type === "slash" && prior.prev.type !== "bos" && rest[0] === "/") {
					const end = rest[1] !== void 0 ? "|$" : "";
					state.output = state.output.slice(0, -(prior.output + prev.output).length);
					prior.output = `(?:${prior.output}`;
					prev.type = "globstar";
					prev.output = `${globstar(opts)}${SLASH_LITERAL$1}|${SLASH_LITERAL$1}${end})`;
					prev.value += value;
					state.output += prior.output + prev.output;
					state.globstar = true;
					consume(value + advance());
					push({
						type: "slash",
						value: "/",
						output: ""
					});
					continue;
				}
				if (prior.type === "bos" && rest[0] === "/") {
					prev.type = "globstar";
					prev.value += value;
					prev.output = `(?:^|${SLASH_LITERAL$1}|${globstar(opts)}${SLASH_LITERAL$1})`;
					state.output = prev.output;
					state.globstar = true;
					consume(value + advance());
					push({
						type: "slash",
						value: "/",
						output: ""
					});
					continue;
				}
				state.output = state.output.slice(0, -prev.output.length);
				prev.type = "globstar";
				prev.output = globstar(opts);
				prev.value += value;
				state.output += prev.output;
				state.globstar = true;
				consume(value);
				continue;
			}
			const token = {
				type: "star",
				value,
				output: star
			};
			if (opts.bash === true) {
				token.output = ".*?";
				if (prev.type === "bos" || prev.type === "slash") token.output = nodot + token.output;
				push(token);
				continue;
			}
			if (prev && (prev.type === "bracket" || prev.type === "paren") && opts.regex === true) {
				token.output = value;
				push(token);
				continue;
			}
			if (state.index === state.start || prev.type === "slash" || prev.type === "dot") {
				if (prev.type === "dot") {
					state.output += NO_DOT_SLASH;
					prev.output += NO_DOT_SLASH;
				} else if (opts.dot === true) {
					state.output += NO_DOTS_SLASH;
					prev.output += NO_DOTS_SLASH;
				} else {
					state.output += nodot;
					prev.output += nodot;
				}
				if (peek() !== "*") {
					state.output += ONE_CHAR$1;
					prev.output += ONE_CHAR$1;
				}
			}
			push(token);
		}
		while (state.brackets > 0) {
			if (opts.strictBrackets === true) throw new SyntaxError(syntaxError("closing", "]"));
			state.output = utils$2.escapeLast(state.output, "[");
			decrement("brackets");
		}
		while (state.parens > 0) {
			if (opts.strictBrackets === true) throw new SyntaxError(syntaxError("closing", ")"));
			state.output = utils$2.escapeLast(state.output, "(");
			decrement("parens");
		}
		while (state.braces > 0) {
			if (opts.strictBrackets === true) throw new SyntaxError(syntaxError("closing", "}"));
			state.output = utils$2.escapeLast(state.output, "{");
			decrement("braces");
		}
		if (opts.strictSlashes !== true && (prev.type === "star" || prev.type === "bracket")) push({
			type: "maybe_slash",
			value: "",
			output: `${SLASH_LITERAL$1}?`
		});
		if (state.backtrack === true) {
			state.output = "";
			for (const token of state.tokens) {
				state.output += token.output != null ? token.output : token.value;
				if (token.suffix) state.output += token.suffix;
			}
		}
		return state;
	};
	parse$1.fastpaths = (input, options) => {
		const opts = { ...options };
		const max = typeof opts.maxLength === "number" ? Math.min(MAX_LENGTH, opts.maxLength) : MAX_LENGTH;
		const len = input.length;
		if (len > max) throw new SyntaxError(`Input length: ${len}, exceeds maximum allowed length: ${max}`);
		input = REPLACEMENTS[input] || input;
		const { DOT_LITERAL: DOT_LITERAL$1, SLASH_LITERAL: SLASH_LITERAL$1, ONE_CHAR: ONE_CHAR$1, DOTS_SLASH: DOTS_SLASH$1, NO_DOT, NO_DOTS, NO_DOTS_SLASH, STAR, START_ANCHOR: START_ANCHOR$1 } = constants$1.globChars(opts.windows);
		const nodot = opts.dot ? NO_DOTS : NO_DOT;
		const slashDot = opts.dot ? NO_DOTS_SLASH : NO_DOT;
		const capture = opts.capture ? "" : "?:";
		const state = {
			negated: false,
			prefix: ""
		};
		let star = opts.bash === true ? ".*?" : STAR;
		if (opts.capture) star = `(${star})`;
		const globstar = (opts$1) => {
			if (opts$1.noglobstar === true) return star;
			return `(${capture}(?:(?!${START_ANCHOR$1}${opts$1.dot ? DOTS_SLASH$1 : DOT_LITERAL$1}).)*?)`;
		};
		const create$1 = (str) => {
			switch (str) {
				case "*": return `${nodot}${ONE_CHAR$1}${star}`;
				case ".*": return `${DOT_LITERAL$1}${ONE_CHAR$1}${star}`;
				case "*.*": return `${nodot}${star}${DOT_LITERAL$1}${ONE_CHAR$1}${star}`;
				case "*/*": return `${nodot}${star}${SLASH_LITERAL$1}${ONE_CHAR$1}${slashDot}${star}`;
				case "**": return nodot + globstar(opts);
				case "**/*": return `(?:${nodot}${globstar(opts)}${SLASH_LITERAL$1})?${slashDot}${ONE_CHAR$1}${star}`;
				case "**/*.*": return `(?:${nodot}${globstar(opts)}${SLASH_LITERAL$1})?${slashDot}${star}${DOT_LITERAL$1}${ONE_CHAR$1}${star}`;
				case "**/.*": return `(?:${nodot}${globstar(opts)}${SLASH_LITERAL$1})?${DOT_LITERAL$1}${ONE_CHAR$1}${star}`;
				default: {
					const match = /^(.*?)\.(\w+)$/.exec(str);
					if (!match) return;
					const source$1 = create$1(match[1]);
					if (!source$1) return;
					return source$1 + DOT_LITERAL$1 + match[2];
				}
			}
		};
		let source = create$1(utils$2.removePrefix(input, state));
		if (source && opts.strictSlashes !== true) source += `${SLASH_LITERAL$1}?`;
		return source;
	};
	module.exports = parse$1;
}));
var require_picomatch$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const scan = require_scan();
	const parse = require_parse();
	const utils$1 = require_utils();
	const constants = require_constants();
	const isObject = (val) => val && typeof val === "object" && !Array.isArray(val);
	const picomatch$2 = (glob$1, options, returnState = false) => {
		if (Array.isArray(glob$1)) {
			const fns = glob$1.map((input) => picomatch$2(input, options, returnState));
			const arrayMatcher = (str) => {
				for (const isMatch of fns) {
					const state$1 = isMatch(str);
					if (state$1) return state$1;
				}
				return false;
			};
			return arrayMatcher;
		}
		const isState = isObject(glob$1) && glob$1.tokens && glob$1.input;
		if (glob$1 === "" || typeof glob$1 !== "string" && !isState) throw new TypeError("Expected pattern to be a non-empty string");
		const opts = options || {};
		const posix$1 = opts.windows;
		const regex$2 = isState ? picomatch$2.compileRe(glob$1, options) : picomatch$2.makeRe(glob$1, options, false, true);
		const state = regex$2.state;
		delete regex$2.state;
		let isIgnored = () => false;
		if (opts.ignore) {
			const ignoreOpts = {
				...options,
				ignore: null,
				onMatch: null,
				onResult: null
			};
			isIgnored = picomatch$2(opts.ignore, ignoreOpts, returnState);
		}
		const matcher = (input, returnObject = false) => {
			const { isMatch, match, output } = picomatch$2.test(input, regex$2, options, {
				glob: glob$1,
				posix: posix$1
			});
			const result = {
				glob: glob$1,
				state,
				regex: regex$2,
				posix: posix$1,
				input,
				output,
				match,
				isMatch
			};
			if (typeof opts.onResult === "function") opts.onResult(result);
			if (isMatch === false) {
				result.isMatch = false;
				return returnObject ? result : false;
			}
			if (isIgnored(input)) {
				if (typeof opts.onIgnore === "function") opts.onIgnore(result);
				result.isMatch = false;
				return returnObject ? result : false;
			}
			if (typeof opts.onMatch === "function") opts.onMatch(result);
			return returnObject ? result : true;
		};
		if (returnState) matcher.state = state;
		return matcher;
	};
	picomatch$2.test = (input, regex$2, options, { glob: glob$1, posix: posix$1 } = {}) => {
		if (typeof input !== "string") throw new TypeError("Expected input to be a string");
		if (input === "") return {
			isMatch: false,
			output: ""
		};
		const opts = options || {};
		const format = opts.format || (posix$1 ? utils$1.toPosixSlashes : null);
		let match = input === glob$1;
		let output = match && format ? format(input) : input;
		if (match === false) {
			output = format ? format(input) : input;
			match = output === glob$1;
		}
		if (match === false || opts.capture === true) if (opts.matchBase === true || opts.basename === true) match = picomatch$2.matchBase(input, regex$2, options, posix$1);
		else match = regex$2.exec(output);
		return {
			isMatch: Boolean(match),
			match,
			output
		};
	};
	picomatch$2.matchBase = (input, glob$1, options) => {
		return (glob$1 instanceof RegExp ? glob$1 : picomatch$2.makeRe(glob$1, options)).test(utils$1.basename(input));
	};
	picomatch$2.isMatch = (str, patterns, options) => picomatch$2(patterns, options)(str);
	picomatch$2.parse = (pattern, options) => {
		if (Array.isArray(pattern)) return pattern.map((p$1) => picomatch$2.parse(p$1, options));
		return parse(pattern, {
			...options,
			fastpaths: false
		});
	};
	picomatch$2.scan = (input, options) => scan(input, options);
	picomatch$2.compileRe = (state, options, returnOutput = false, returnState = false) => {
		if (returnOutput === true) return state.output;
		const opts = options || {};
		const prepend = opts.contains ? "" : "^";
		const append = opts.contains ? "" : "$";
		let source = `${prepend}(?:${state.output})${append}`;
		if (state && state.negated === true) source = `^(?!${source}).*$`;
		const regex$2 = picomatch$2.toRegex(source, options);
		if (returnState === true) regex$2.state = state;
		return regex$2;
	};
	picomatch$2.makeRe = (input, options = {}, returnOutput = false, returnState = false) => {
		if (!input || typeof input !== "string") throw new TypeError("Expected a non-empty string");
		let parsed = {
			negated: false,
			fastpaths: true
		};
		if (options.fastpaths !== false && (input[0] === "." || input[0] === "*")) parsed.output = parse.fastpaths(input, options);
		if (!parsed.output) parsed = parse(input, options);
		return picomatch$2.compileRe(parsed, options, returnOutput, returnState);
	};
	picomatch$2.toRegex = (source, options) => {
		try {
			const opts = options || {};
			return new RegExp(source, opts.flags || (opts.nocase ? "i" : ""));
		} catch (err) {
			if (options && options.debug === true) throw err;
			return /$^/;
		}
	};
	picomatch$2.constants = constants;
	module.exports = picomatch$2;
}));
var import_picomatch = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports, module) => {
	const pico = require_picomatch$1();
	const utils = require_utils();
	function picomatch$1(glob$1, options, returnState = false) {
		if (options && (options.windows === null || options.windows === void 0)) options = {
			...options,
			windows: utils.isWindows()
		};
		return pico(glob$1, options, returnState);
	}
	Object.assign(picomatch$1, pico);
	module.exports = picomatch$1;
})))(), 1);
const isReadonlyArray = Array.isArray;
const isWin = process.platform === "win32";
const ONLY_PARENT_DIRECTORIES = /^(\/?\.\.)+$/;
function getPartialMatcher(patterns, options = {}) {
	const patternsCount = patterns.length;
	const patternsParts = Array(patternsCount);
	const matchers = Array(patternsCount);
	const globstarEnabled = !options.noglobstar;
	for (let i$1 = 0; i$1 < patternsCount; i$1++) {
		const parts = splitPattern(patterns[i$1]);
		patternsParts[i$1] = parts;
		const partsCount = parts.length;
		const partMatchers = Array(partsCount);
		for (let j$1 = 0; j$1 < partsCount; j$1++) partMatchers[j$1] = (0, import_picomatch.default)(parts[j$1], options);
		matchers[i$1] = partMatchers;
	}
	return (input) => {
		const inputParts = input.split("/");
		if (inputParts[0] === ".." && ONLY_PARENT_DIRECTORIES.test(input)) return true;
		for (let i$1 = 0; i$1 < patterns.length; i$1++) {
			const patternParts = patternsParts[i$1];
			const matcher = matchers[i$1];
			const inputPatternCount = inputParts.length;
			const minParts = Math.min(inputPatternCount, patternParts.length);
			let j$1 = 0;
			while (j$1 < minParts) {
				const part = patternParts[j$1];
				if (part.includes("/")) return true;
				if (!matcher[j$1](inputParts[j$1])) break;
				if (globstarEnabled && part === "**") return true;
				j$1++;
			}
			if (j$1 === inputPatternCount) return true;
		}
		return false;
	};
}
/* node:coverage ignore next 2 */
const WIN32_ROOT_DIR = /^[A-Z]:\/$/i;
const isRoot = isWin ? (p$1) => WIN32_ROOT_DIR.test(p$1) : (p$1) => p$1 === "/";
function buildFormat(cwd, root, absolute) {
	if (cwd === root || root.startsWith(`${cwd}/`)) {
		if (absolute) {
			const start = isRoot(cwd) ? cwd.length : cwd.length + 1;
			return (p$1, isDir) => p$1.slice(start, isDir ? -1 : void 0) || ".";
		}
		const prefix = root.slice(cwd.length + 1);
		if (prefix) return (p$1, isDir) => {
			if (p$1 === ".") return prefix;
			const result = `${prefix}/${p$1}`;
			return isDir ? result.slice(0, -1) : result;
		};
		return (p$1, isDir) => isDir && p$1 !== "." ? p$1.slice(0, -1) : p$1;
	}
	if (absolute) return (p$1) => posix.relative(cwd, p$1) || ".";
	return (p$1) => posix.relative(cwd, `${root}/${p$1}`) || ".";
}
function buildRelative(cwd, root) {
	if (root.startsWith(`${cwd}/`)) {
		const prefix = root.slice(cwd.length + 1);
		return (p$1) => `${prefix}/${p$1}`;
	}
	return (p$1) => {
		const result = posix.relative(cwd, `${root}/${p$1}`);
		if (p$1.endsWith("/") && result !== "") return `${result}/`;
		return result || ".";
	};
}
const splitPatternOptions = { parts: true };
function splitPattern(path$1) {
	var _result$parts;
	const result = import_picomatch.default.scan(path$1, splitPatternOptions);
	return ((_result$parts = result.parts) === null || _result$parts === void 0 ? void 0 : _result$parts.length) ? result.parts : [path$1];
}
const POSIX_UNESCAPED_GLOB_SYMBOLS = /(?<!\\)([()[\]{}*?|]|^!|[!+@](?=\()|\\(?![()[\]{}!*+?@|]))/g;
const WIN32_UNESCAPED_GLOB_SYMBOLS = /(?<!\\)([()[\]{}]|^!|[!+@](?=\())/g;
const escapePosixPath = (path$1) => path$1.replace(POSIX_UNESCAPED_GLOB_SYMBOLS, "\\$&");
const escapeWin32Path = (path$1) => path$1.replace(WIN32_UNESCAPED_GLOB_SYMBOLS, "\\$&");
/* node:coverage ignore next */
const escapePath = isWin ? escapeWin32Path : escapePosixPath;
function isDynamicPattern(pattern, options) {
	if ((options === null || options === void 0 ? void 0 : options.caseSensitiveMatch) === false) return true;
	const scan$2 = import_picomatch.default.scan(pattern);
	return scan$2.isGlob || scan$2.negated;
}
function log$2(...tasks) {
	console.log(`[tinyglobby ${(/* @__PURE__ */ new Date()).toLocaleTimeString("es")}]`, ...tasks);
}
const PARENT_DIRECTORY = /^(\/?\.\.)+/;
const ESCAPING_BACKSLASHES = /\\(?=[()[\]{}!*+?@|])/g;
const BACKSLASHES = /\\/g;
function normalizePattern(pattern, expandDirectories, cwd, props, isIgnore) {
	let result = pattern;
	if (pattern.endsWith("/")) result = pattern.slice(0, -1);
	if (!result.endsWith("*") && expandDirectories) result += "/**";
	const escapedCwd = escapePath(cwd);
	if (path.isAbsolute(result.replace(ESCAPING_BACKSLASHES, ""))) result = posix.relative(escapedCwd, result);
	else result = posix.normalize(result);
	const parentDirectoryMatch = PARENT_DIRECTORY.exec(result);
	const parts = splitPattern(result);
	if (parentDirectoryMatch === null || parentDirectoryMatch === void 0 ? void 0 : parentDirectoryMatch[0]) {
		const n$2 = (parentDirectoryMatch[0].length + 1) / 3;
		let i$1 = 0;
		const cwdParts = escapedCwd.split("/");
		while (i$1 < n$2 && parts[i$1 + n$2] === cwdParts[cwdParts.length + i$1 - n$2]) {
			result = result.slice(0, (n$2 - i$1 - 1) * 3) + result.slice((n$2 - i$1) * 3 + parts[i$1 + n$2].length + 1) || ".";
			i$1++;
		}
		const potentialRoot = posix.join(cwd, parentDirectoryMatch[0].slice(i$1 * 3));
		if (!potentialRoot.startsWith(".") && props.root.length > potentialRoot.length) {
			props.root = potentialRoot;
			props.depthOffset = -n$2 + i$1;
		}
	}
	if (!isIgnore && props.depthOffset >= 0) {
		var _props$commonPath;
		(_props$commonPath = props.commonPath) !== null && _props$commonPath !== void 0 || (props.commonPath = parts);
		const newCommonPath = [];
		const length = Math.min(props.commonPath.length, parts.length);
		for (let i$1 = 0; i$1 < length; i$1++) {
			const part = parts[i$1];
			if (part === "**" && !parts[i$1 + 1]) {
				newCommonPath.pop();
				break;
			}
			if (part !== props.commonPath[i$1] || isDynamicPattern(part) || i$1 === parts.length - 1) break;
			newCommonPath.push(part);
		}
		props.depthOffset = newCommonPath.length;
		props.commonPath = newCommonPath;
		props.root = newCommonPath.length > 0 ? posix.join(cwd, ...newCommonPath) : cwd;
	}
	return result;
}
function processPatterns({ patterns = ["**/*"], ignore = [], expandDirectories = true }, cwd, props) {
	if (typeof patterns === "string") patterns = [patterns];
	if (typeof ignore === "string") ignore = [ignore];
	const matchPatterns = [];
	const ignorePatterns = [];
	for (const pattern of ignore) {
		if (!pattern) continue;
		if (pattern[0] !== "!" || pattern[1] === "(") ignorePatterns.push(normalizePattern(pattern, expandDirectories, cwd, props, true));
	}
	for (const pattern of patterns) {
		if (!pattern) continue;
		if (pattern[0] !== "!" || pattern[1] === "(") matchPatterns.push(normalizePattern(pattern, expandDirectories, cwd, props, false));
		else if (pattern[1] !== "!" || pattern[2] === "(") ignorePatterns.push(normalizePattern(pattern.slice(1), expandDirectories, cwd, props, true));
	}
	return {
		match: matchPatterns,
		ignore: ignorePatterns
	};
}
function formatPaths(paths, relative$1) {
	for (let i$1 = paths.length - 1; i$1 >= 0; i$1--) {
		const path$1 = paths[i$1];
		paths[i$1] = relative$1(path$1);
	}
	return paths;
}
function normalizeCwd(cwd) {
	if (!cwd) return process.cwd().replace(BACKSLASHES, "/");
	if (cwd instanceof URL) return fileURLToPath(cwd).replace(BACKSLASHES, "/");
	return path.resolve(cwd).replace(BACKSLASHES, "/");
}
function getCrawler(patterns, inputOptions = {}) {
	const options = process.env.TINYGLOBBY_DEBUG ? {
		...inputOptions,
		debug: true
	} : inputOptions;
	const cwd = normalizeCwd(options.cwd);
	if (options.debug) log$2("globbing with:", {
		patterns,
		options,
		cwd
	});
	if (Array.isArray(patterns) && patterns.length === 0) return [{
		sync: () => [],
		withPromise: async () => []
	}, false];
	const props = {
		root: cwd,
		commonPath: null,
		depthOffset: 0
	};
	const processed = processPatterns({
		...options,
		patterns
	}, cwd, props);
	if (options.debug) log$2("internal processing patterns:", processed);
	const matchOptions = {
		dot: options.dot,
		nobrace: options.braceExpansion === false,
		nocase: options.caseSensitiveMatch === false,
		noextglob: options.extglob === false,
		noglobstar: options.globstar === false,
		posix: true
	};
	const matcher = (0, import_picomatch.default)(processed.match, {
		...matchOptions,
		ignore: processed.ignore
	});
	const ignore = (0, import_picomatch.default)(processed.ignore, matchOptions);
	const partialMatcher = getPartialMatcher(processed.match, matchOptions);
	const format = buildFormat(cwd, props.root, options.absolute);
	const formatExclude = options.absolute ? format : buildFormat(cwd, props.root, true);
	const fdirOptions = {
		filters: [options.debug ? (p$1, isDirectory) => {
			const path$1 = format(p$1, isDirectory);
			const matches = matcher(path$1);
			if (matches) log$2(`matched ${path$1}`);
			return matches;
		} : (p$1, isDirectory) => matcher(format(p$1, isDirectory))],
		exclude: options.debug ? (_$1, p$1) => {
			const relativePath = formatExclude(p$1, true);
			const skipped = relativePath !== "." && !partialMatcher(relativePath) || ignore(relativePath);
			if (skipped) log$2(`skipped ${p$1}`);
			else log$2(`crawling ${p$1}`);
			return skipped;
		} : (_$1, p$1) => {
			const relativePath = formatExclude(p$1, true);
			return relativePath !== "." && !partialMatcher(relativePath) || ignore(relativePath);
		},
		fs: options.fs ? {
			readdir: options.fs.readdir || b.readdir,
			readdirSync: options.fs.readdirSync || b.readdirSync,
			realpath: options.fs.realpath || b.realpath,
			realpathSync: options.fs.realpathSync || b.realpathSync,
			stat: options.fs.stat || b.stat,
			statSync: options.fs.statSync || b.statSync
		} : void 0,
		pathSeparator: "/",
		relativePaths: true,
		resolveSymlinks: true,
		signal: options.signal
	};
	if (options.deep !== void 0) fdirOptions.maxDepth = Math.round(options.deep - props.depthOffset);
	if (options.absolute) {
		fdirOptions.relativePaths = false;
		fdirOptions.resolvePaths = true;
		fdirOptions.includeBasePath = true;
	}
	if (options.followSymbolicLinks === false) {
		fdirOptions.resolveSymlinks = false;
		fdirOptions.excludeSymlinks = true;
	}
	if (options.onlyDirectories) {
		fdirOptions.excludeFiles = true;
		fdirOptions.includeDirs = true;
	} else if (options.onlyFiles === false) fdirOptions.includeDirs = true;
	props.root = props.root.replace(BACKSLASHES, "");
	const root = props.root;
	if (options.debug) log$2("internal properties:", props);
	const relative$1 = cwd !== root && !options.absolute && buildRelative(cwd, props.root);
	return [new Builder(fdirOptions).crawl(root), relative$1];
}
async function glob(patternsOrOptions, options) {
	if (patternsOrOptions && (options === null || options === void 0 ? void 0 : options.patterns)) throw new Error("Cannot pass patterns as both an argument and an option");
	const isModern = isReadonlyArray(patternsOrOptions) || typeof patternsOrOptions === "string";
	const opts = isModern ? options : patternsOrOptions;
	const [crawler, relative$1] = getCrawler(isModern ? patternsOrOptions : patternsOrOptions.patterns, opts);
	if (!relative$1) return crawler.withPromise();
	return formatPaths(await crawler.withPromise(), relative$1);
}
var store;
/* @__NO_SIDE_EFFECTS__ */
function getGlobalConfig(config2) {
	return {
		lang: config2?.lang ?? store?.lang,
		message: config2?.message,
		abortEarly: config2?.abortEarly ?? store?.abortEarly,
		abortPipeEarly: config2?.abortPipeEarly ?? store?.abortPipeEarly
	};
}
var store2;
/* @__NO_SIDE_EFFECTS__ */
function getGlobalMessage(lang) {
	return store2?.get(lang);
}
var store3;
/* @__NO_SIDE_EFFECTS__ */
function getSchemaMessage(lang) {
	return store3?.get(lang);
}
var store4;
/* @__NO_SIDE_EFFECTS__ */
function getSpecificMessage(reference, lang) {
	return store4?.get(reference)?.get(lang);
}
/* @__NO_SIDE_EFFECTS__ */
function _stringify(input) {
	const type = typeof input;
	if (type === "string") return `"${input}"`;
	if (type === "number" || type === "bigint" || type === "boolean") return `${input}`;
	if (type === "object" || type === "function") return (input && Object.getPrototypeOf(input)?.constructor?.name) ?? "null";
	return type;
}
function _addIssue(context, label, dataset, config2, other) {
	const input = other && "input" in other ? other.input : dataset.value;
	const expected = other?.expected ?? context.expects ?? null;
	const received = other?.received ?? /* @__PURE__ */ _stringify(input);
	const issue = {
		kind: context.kind,
		type: context.type,
		input,
		expected,
		received,
		message: `Invalid ${label}: ${expected ? `Expected ${expected} but r` : "R"}eceived ${received}`,
		requirement: context.requirement,
		path: other?.path,
		issues: other?.issues,
		lang: config2.lang,
		abortEarly: config2.abortEarly,
		abortPipeEarly: config2.abortPipeEarly
	};
	const isSchema = context.kind === "schema";
	const message2 = other?.message ?? context.message ?? /* @__PURE__ */ getSpecificMessage(context.reference, issue.lang) ?? (isSchema ? /* @__PURE__ */ getSchemaMessage(issue.lang) : null) ?? config2.message ?? /* @__PURE__ */ getGlobalMessage(issue.lang);
	if (message2 !== void 0) issue.message = typeof message2 === "function" ? message2(issue) : message2;
	if (isSchema) dataset.typed = false;
	if (dataset.issues) dataset.issues.push(issue);
	else dataset.issues = [issue];
}
/* @__NO_SIDE_EFFECTS__ */
function _getStandardProps(context) {
	return {
		version: 1,
		vendor: "valibot",
		validate(value2) {
			return context["~run"]({ value: value2 }, /* @__PURE__ */ getGlobalConfig());
		}
	};
}
/* @__NO_SIDE_EFFECTS__ */
function _isValidObjectKey(object2, key) {
	return Object.hasOwn(object2, key) && key !== "__proto__" && key !== "prototype" && key !== "constructor";
}
/* @__NO_SIDE_EFFECTS__ */
function getFallback(schema, dataset, config2) {
	return typeof schema.fallback === "function" ? schema.fallback(dataset, config2) : schema.fallback;
}
/* @__NO_SIDE_EFFECTS__ */
function getDefault(schema, dataset, config2) {
	return typeof schema.default === "function" ? schema.default(dataset, config2) : schema.default;
}
/* @__NO_SIDE_EFFECTS__ */
function literal(literal_, message2) {
	return {
		kind: "schema",
		type: "literal",
		reference: literal,
		expects: /* @__PURE__ */ _stringify(literal_),
		async: false,
		literal: literal_,
		message: message2,
		get "~standard"() {
			return /* @__PURE__ */ _getStandardProps(this);
		},
		"~run"(dataset, config2) {
			if (dataset.value === this.literal) dataset.typed = true;
			else _addIssue(this, "type", dataset, config2);
			return dataset;
		}
	};
}
/* @__NO_SIDE_EFFECTS__ */
function number(message2) {
	return {
		kind: "schema",
		type: "number",
		reference: number,
		expects: "number",
		async: false,
		message: message2,
		get "~standard"() {
			return /* @__PURE__ */ _getStandardProps(this);
		},
		"~run"(dataset, config2) {
			if (typeof dataset.value === "number" && !isNaN(dataset.value)) dataset.typed = true;
			else _addIssue(this, "type", dataset, config2);
			return dataset;
		}
	};
}
/* @__NO_SIDE_EFFECTS__ */
function object(entries2, message2) {
	return {
		kind: "schema",
		type: "object",
		reference: object,
		expects: "Object",
		async: false,
		entries: entries2,
		message: message2,
		get "~standard"() {
			return /* @__PURE__ */ _getStandardProps(this);
		},
		"~run"(dataset, config2) {
			const input = dataset.value;
			if (input && typeof input === "object") {
				dataset.typed = true;
				dataset.value = {};
				for (const key in this.entries) {
					const valueSchema = this.entries[key];
					if (key in input || (valueSchema.type === "exact_optional" || valueSchema.type === "optional" || valueSchema.type === "nullish") && valueSchema.default !== void 0) {
						const value2 = key in input ? input[key] : /* @__PURE__ */ getDefault(valueSchema);
						const valueDataset = valueSchema["~run"]({ value: value2 }, config2);
						if (valueDataset.issues) {
							const pathItem = {
								type: "object",
								origin: "value",
								input,
								key,
								value: value2
							};
							for (const issue of valueDataset.issues) {
								if (issue.path) issue.path.unshift(pathItem);
								else issue.path = [pathItem];
								dataset.issues?.push(issue);
							}
							if (!dataset.issues) dataset.issues = valueDataset.issues;
							if (config2.abortEarly) {
								dataset.typed = false;
								break;
							}
						}
						if (!valueDataset.typed) dataset.typed = false;
						dataset.value[key] = valueDataset.value;
					} else if (valueSchema.fallback !== void 0) dataset.value[key] = /* @__PURE__ */ getFallback(valueSchema);
					else if (valueSchema.type !== "exact_optional" && valueSchema.type !== "optional" && valueSchema.type !== "nullish") {
						_addIssue(this, "key", dataset, config2, {
							input: void 0,
							expected: `"${key}"`,
							path: [{
								type: "object",
								origin: "key",
								input,
								key,
								value: input[key]
							}]
						});
						if (config2.abortEarly) break;
					}
				}
			} else _addIssue(this, "type", dataset, config2);
			return dataset;
		}
	};
}
/* @__NO_SIDE_EFFECTS__ */
function optional(wrapped, default_) {
	return {
		kind: "schema",
		type: "optional",
		reference: optional,
		expects: `(${wrapped.expects} | undefined)`,
		async: false,
		wrapped,
		default: default_,
		get "~standard"() {
			return /* @__PURE__ */ _getStandardProps(this);
		},
		"~run"(dataset, config2) {
			if (dataset.value === void 0) {
				if (this.default !== void 0) dataset.value = /* @__PURE__ */ getDefault(this, dataset, config2);
				if (dataset.value === void 0) {
					dataset.typed = true;
					return dataset;
				}
			}
			return this.wrapped["~run"](dataset, config2);
		}
	};
}
/* @__NO_SIDE_EFFECTS__ */
function record(key, value2, message2) {
	return {
		kind: "schema",
		type: "record",
		reference: record,
		expects: "Object",
		async: false,
		key,
		value: value2,
		message: message2,
		get "~standard"() {
			return /* @__PURE__ */ _getStandardProps(this);
		},
		"~run"(dataset, config2) {
			const input = dataset.value;
			if (input && typeof input === "object") {
				dataset.typed = true;
				dataset.value = {};
				for (const entryKey in input) if (/* @__PURE__ */ _isValidObjectKey(input, entryKey)) {
					const entryValue = input[entryKey];
					const keyDataset = this.key["~run"]({ value: entryKey }, config2);
					if (keyDataset.issues) {
						const pathItem = {
							type: "object",
							origin: "key",
							input,
							key: entryKey,
							value: entryValue
						};
						for (const issue of keyDataset.issues) {
							issue.path = [pathItem];
							dataset.issues?.push(issue);
						}
						if (!dataset.issues) dataset.issues = keyDataset.issues;
						if (config2.abortEarly) {
							dataset.typed = false;
							break;
						}
					}
					const valueDataset = this.value["~run"]({ value: entryValue }, config2);
					if (valueDataset.issues) {
						const pathItem = {
							type: "object",
							origin: "value",
							input,
							key: entryKey,
							value: entryValue
						};
						for (const issue of valueDataset.issues) {
							if (issue.path) issue.path.unshift(pathItem);
							else issue.path = [pathItem];
							dataset.issues?.push(issue);
						}
						if (!dataset.issues) dataset.issues = valueDataset.issues;
						if (config2.abortEarly) {
							dataset.typed = false;
							break;
						}
					}
					if (!keyDataset.typed || !valueDataset.typed) dataset.typed = false;
					if (keyDataset.typed) dataset.value[keyDataset.value] = valueDataset.value;
				}
			} else _addIssue(this, "type", dataset, config2);
			return dataset;
		}
	};
}
/* @__NO_SIDE_EFFECTS__ */
function string(message2) {
	return {
		kind: "schema",
		type: "string",
		reference: string,
		expects: "string",
		async: false,
		message: message2,
		get "~standard"() {
			return /* @__PURE__ */ _getStandardProps(this);
		},
		"~run"(dataset, config2) {
			if (typeof dataset.value === "string") dataset.typed = true;
			else _addIssue(this, "type", dataset, config2);
			return dataset;
		}
	};
}
/* @__NO_SIDE_EFFECTS__ */
function unknown() {
	return {
		kind: "schema",
		type: "unknown",
		reference: unknown,
		expects: "unknown",
		async: false,
		get "~standard"() {
			return /* @__PURE__ */ _getStandardProps(this);
		},
		"~run"(dataset) {
			dataset.typed = true;
			return dataset;
		}
	};
}
/* @__NO_SIDE_EFFECTS__ */
function safeParse(schema, input, config2) {
	const dataset = schema["~run"]({ value: input }, /* @__PURE__ */ getGlobalConfig(config2));
	return {
		typed: dataset.typed,
		success: !dataset.issues,
		output: dataset.value,
		issues: dataset.issues
	};
}
const LogLevels = {
	silent: Number.NEGATIVE_INFINITY,
	fatal: 0,
	error: 0,
	warn: 1,
	log: 2,
	info: 3,
	success: 3,
	fail: 3,
	ready: 3,
	start: 3,
	box: 3,
	debug: 4,
	trace: 5,
	verbose: Number.POSITIVE_INFINITY
};
const LogTypes = {
	silent: { level: -1 },
	fatal: { level: LogLevels.fatal },
	error: { level: LogLevels.error },
	warn: { level: LogLevels.warn },
	log: { level: LogLevels.log },
	info: { level: LogLevels.info },
	success: { level: LogLevels.success },
	fail: { level: LogLevels.fail },
	ready: { level: LogLevels.info },
	start: { level: LogLevels.info },
	box: { level: LogLevels.info },
	debug: { level: LogLevels.debug },
	trace: { level: LogLevels.trace },
	verbose: { level: LogLevels.verbose }
};
function isPlainObject$1(value) {
	if (value === null || typeof value !== "object") return false;
	const prototype = Object.getPrototypeOf(value);
	if (prototype !== null && prototype !== Object.prototype && Object.getPrototypeOf(prototype) !== null) return false;
	if (Symbol.iterator in value) return false;
	if (Symbol.toStringTag in value) return Object.prototype.toString.call(value) === "[object Module]";
	return true;
}
function _defu(baseObject, defaults, namespace = ".", merger) {
	if (!isPlainObject$1(defaults)) return _defu(baseObject, {}, namespace, merger);
	const object$1 = Object.assign({}, defaults);
	for (const key in baseObject) {
		if (key === "__proto__" || key === "constructor") continue;
		const value = baseObject[key];
		if (value === null || value === void 0) continue;
		if (merger && merger(object$1, key, value, namespace)) continue;
		if (Array.isArray(value) && Array.isArray(object$1[key])) object$1[key] = [...value, ...object$1[key]];
		else if (isPlainObject$1(value) && isPlainObject$1(object$1[key])) object$1[key] = _defu(value, object$1[key], (namespace ? `${namespace}.` : "") + key.toString(), merger);
		else object$1[key] = value;
	}
	return object$1;
}
function createDefu(merger) {
	return (...arguments_) => arguments_.reduce((p$1, c$1) => _defu(p$1, c$1, "", merger), {});
}
const defu = createDefu();
function isPlainObject(obj) {
	return Object.prototype.toString.call(obj) === "[object Object]";
}
function isLogObj(arg) {
	if (!isPlainObject(arg)) return false;
	if (!arg.message && !arg.args) return false;
	if (arg.stack) return false;
	return true;
}
let paused = false;
const queue = [];
var Consola = class Consola {
	options;
	_lastLog;
	_mockFn;
	constructor(options = {}) {
		const types = options.types || LogTypes;
		this.options = defu({
			...options,
			defaults: { ...options.defaults },
			level: _normalizeLogLevel(options.level, types),
			reporters: [...options.reporters || []]
		}, {
			types: LogTypes,
			throttle: 1e3,
			throttleMin: 5,
			formatOptions: {
				date: true,
				colors: false,
				compact: true
			}
		});
		for (const type in types) {
			const defaults = {
				type,
				...this.options.defaults,
				...types[type]
			};
			this[type] = this._wrapLogFn(defaults);
			this[type].raw = this._wrapLogFn(defaults, true);
		}
		if (this.options.mockFn) this.mockTypes();
		this._lastLog = {};
	}
	get level() {
		return this.options.level;
	}
	set level(level$1) {
		this.options.level = _normalizeLogLevel(level$1, this.options.types, this.options.level);
	}
	prompt(message, opts) {
		if (!this.options.prompt) throw new Error("prompt is not supported!");
		return this.options.prompt(message, opts);
	}
	create(options) {
		const instance = new Consola({
			...this.options,
			...options
		});
		if (this._mockFn) instance.mockTypes(this._mockFn);
		return instance;
	}
	withDefaults(defaults) {
		return this.create({
			...this.options,
			defaults: {
				...this.options.defaults,
				...defaults
			}
		});
	}
	withTag(tag) {
		return this.withDefaults({ tag: this.options.defaults.tag ? this.options.defaults.tag + ":" + tag : tag });
	}
	addReporter(reporter) {
		this.options.reporters.push(reporter);
		return this;
	}
	removeReporter(reporter) {
		if (reporter) {
			const i$1 = this.options.reporters.indexOf(reporter);
			if (i$1 !== -1) return this.options.reporters.splice(i$1, 1);
		} else this.options.reporters.splice(0);
		return this;
	}
	setReporters(reporters) {
		this.options.reporters = Array.isArray(reporters) ? reporters : [reporters];
		return this;
	}
	wrapAll() {
		this.wrapConsole();
		this.wrapStd();
	}
	restoreAll() {
		this.restoreConsole();
		this.restoreStd();
	}
	wrapConsole() {
		for (const type in this.options.types) {
			if (!console["__" + type]) console["__" + type] = console[type];
			console[type] = this[type].raw;
		}
	}
	restoreConsole() {
		for (const type in this.options.types) if (console["__" + type]) {
			console[type] = console["__" + type];
			delete console["__" + type];
		}
	}
	wrapStd() {
		this._wrapStream(this.options.stdout, "log");
		this._wrapStream(this.options.stderr, "log");
	}
	_wrapStream(stream, type) {
		if (!stream) return;
		if (!stream.__write) stream.__write = stream.write;
		stream.write = (data) => {
			this[type].raw(String(data).trim());
		};
	}
	restoreStd() {
		this._restoreStream(this.options.stdout);
		this._restoreStream(this.options.stderr);
	}
	_restoreStream(stream) {
		if (!stream) return;
		if (stream.__write) {
			stream.write = stream.__write;
			delete stream.__write;
		}
	}
	pauseLogs() {
		paused = true;
	}
	resumeLogs() {
		paused = false;
		const _queue = queue.splice(0);
		for (const item of _queue) item[0]._logFn(item[1], item[2]);
	}
	mockTypes(mockFn) {
		const _mockFn = mockFn || this.options.mockFn;
		this._mockFn = _mockFn;
		if (typeof _mockFn !== "function") return;
		for (const type in this.options.types) {
			this[type] = _mockFn(type, this.options.types[type]) || this[type];
			this[type].raw = this[type];
		}
	}
	_wrapLogFn(defaults, isRaw) {
		return (...args) => {
			if (paused) {
				queue.push([
					this,
					defaults,
					args,
					isRaw
				]);
				return;
			}
			return this._logFn(defaults, args, isRaw);
		};
	}
	_logFn(defaults, args, isRaw) {
		if ((defaults.level || 0) > this.level) return false;
		const logObj = {
			date: /* @__PURE__ */ new Date(),
			args: [],
			...defaults,
			level: _normalizeLogLevel(defaults.level, this.options.types)
		};
		if (!isRaw && args.length === 1 && isLogObj(args[0])) Object.assign(logObj, args[0]);
		else logObj.args = [...args];
		if (logObj.message) {
			logObj.args.unshift(logObj.message);
			delete logObj.message;
		}
		if (logObj.additional) {
			if (!Array.isArray(logObj.additional)) logObj.additional = logObj.additional.split("\n");
			logObj.args.push("\n" + logObj.additional.join("\n"));
			delete logObj.additional;
		}
		logObj.type = typeof logObj.type === "string" ? logObj.type.toLowerCase() : "log";
		logObj.tag = typeof logObj.tag === "string" ? logObj.tag : "";
		const resolveLog = (newLog = false) => {
			const repeated = (this._lastLog.count || 0) - this.options.throttleMin;
			if (this._lastLog.object && repeated > 0) {
				const args2 = [...this._lastLog.object.args];
				if (repeated > 1) args2.push(`(repeated ${repeated} times)`);
				this._log({
					...this._lastLog.object,
					args: args2
				});
				this._lastLog.count = 1;
			}
			if (newLog) {
				this._lastLog.object = logObj;
				this._log(logObj);
			}
		};
		clearTimeout(this._lastLog.timeout);
		const diffTime = this._lastLog.time && logObj.date ? logObj.date.getTime() - this._lastLog.time.getTime() : 0;
		this._lastLog.time = logObj.date;
		if (diffTime < this.options.throttle) try {
			const serializedLog = JSON.stringify([
				logObj.type,
				logObj.tag,
				logObj.args
			]);
			const isSameLog = this._lastLog.serialized === serializedLog;
			this._lastLog.serialized = serializedLog;
			if (isSameLog) {
				this._lastLog.count = (this._lastLog.count || 0) + 1;
				if (this._lastLog.count > this.options.throttleMin) {
					this._lastLog.timeout = setTimeout(resolveLog, this.options.throttle);
					return;
				}
			}
		} catch {}
		resolveLog(true);
	}
	_log(logObj) {
		for (const reporter of this.options.reporters) reporter.log(logObj, { options: this.options });
	}
};
function _normalizeLogLevel(input, types = {}, defaultLevel = 3) {
	if (input === void 0) return defaultLevel;
	if (typeof input === "number") return input;
	if (types[input] && types[input].level !== void 0) return types[input].level;
	return defaultLevel;
}
Consola.prototype.add = Consola.prototype.addReporter;
Consola.prototype.remove = Consola.prototype.removeReporter;
Consola.prototype.clear = Consola.prototype.removeReporter;
Consola.prototype.withScope = Consola.prototype.withTag;
Consola.prototype.mock = Consola.prototype.mockTypes;
Consola.prototype.pause = Consola.prototype.pauseLogs;
Consola.prototype.resume = Consola.prototype.resumeLogs;
function createConsola(options = {}) {
	return new Consola(options);
}
function parseStack(stack, message) {
	const cwd = process.cwd() + sep;
	return stack.split("\n").splice(message.split("\n").length).map((l$2) => l$2.trim().replace("file://", "").replace(cwd, ""));
}
function writeStream(data, stream) {
	return (stream.__write || stream.write).call(stream, data);
}
const bracket = (x) => x ? `[${x}]` : "";
var BasicReporter = class {
	formatStack(stack, message, opts) {
		const indent = "  ".repeat((opts?.errorLevel || 0) + 1);
		return indent + parseStack(stack, message).join(`
${indent}`);
	}
	formatError(err, opts) {
		const message = err.message ?? formatWithOptions(opts, err);
		const stack = err.stack ? this.formatStack(err.stack, message, opts) : "";
		const level$1 = opts?.errorLevel || 0;
		const causedPrefix = level$1 > 0 ? `${"  ".repeat(level$1)}[cause]: ` : "";
		const causedError = err.cause ? "\n\n" + this.formatError(err.cause, {
			...opts,
			errorLevel: level$1 + 1
		}) : "";
		return causedPrefix + message + "\n" + stack + causedError;
	}
	formatArgs(args, opts) {
		return formatWithOptions(opts, ...args.map((arg) => {
			if (arg && typeof arg.stack === "string") return this.formatError(arg, opts);
			return arg;
		}));
	}
	formatDate(date, opts) {
		return opts.date ? date.toLocaleTimeString() : "";
	}
	filterAndJoin(arr) {
		return arr.filter(Boolean).join(" ");
	}
	formatLogObj(logObj, opts) {
		const message = this.formatArgs(logObj.args, opts);
		if (logObj.type === "box") return "\n" + [
			bracket(logObj.tag),
			logObj.title && logObj.title,
			...message.split("\n")
		].filter(Boolean).map((l$2) => " > " + l$2).join("\n") + "\n";
		return this.filterAndJoin([
			bracket(logObj.type),
			bracket(logObj.tag),
			message
		]);
	}
	log(logObj, ctx) {
		return writeStream(this.formatLogObj(logObj, {
			columns: ctx.options.stdout.columns || 0,
			...ctx.options.formatOptions
		}) + "\n", logObj.level < 2 ? ctx.options.stderr || process.stderr : ctx.options.stdout || process.stdout);
	}
};
const { env = {}, argv = [], platform = "" } = typeof process === "undefined" ? {} : process;
const isDisabled = "NO_COLOR" in env || argv.includes("--no-color");
const isForced = "FORCE_COLOR" in env || argv.includes("--color");
const isWindows = platform === "win32";
const isDumbTerminal = env.TERM === "dumb";
const isCompatibleTerminal = tty && tty.isatty && tty.isatty(1) && env.TERM && !isDumbTerminal;
const isCI = "CI" in env && ("GITHUB_ACTIONS" in env || "GITLAB_CI" in env || "CIRCLECI" in env);
const isColorSupported = !isDisabled && (isForced || isWindows && !isDumbTerminal || isCompatibleTerminal || isCI);
function replaceClose(index, string$1, close, replace, head = string$1.slice(0, Math.max(0, index)) + replace, tail = string$1.slice(Math.max(0, index + close.length)), next = tail.indexOf(close)) {
	return head + (next < 0 ? tail : replaceClose(next, tail, close, replace));
}
function clearBleed(index, string$1, open, close, replace) {
	return index < 0 ? open + string$1 + close : open + replaceClose(index, string$1, close, replace) + close;
}
function filterEmpty(open, close, replace = open, at = open.length + 1) {
	return (string$1) => string$1 || !(string$1 === "" || string$1 === void 0) ? clearBleed(("" + string$1).indexOf(close, at), string$1, open, close, replace) : "";
}
function init(open, close, replace) {
	return filterEmpty(`\x1B[${open}m`, `\x1B[${close}m`, replace);
}
const colorDefs = {
	reset: init(0, 0),
	bold: init(1, 22, "\x1B[22m\x1B[1m"),
	dim: init(2, 22, "\x1B[22m\x1B[2m"),
	italic: init(3, 23),
	underline: init(4, 24),
	inverse: init(7, 27),
	hidden: init(8, 28),
	strikethrough: init(9, 29),
	black: init(30, 39),
	red: init(31, 39),
	green: init(32, 39),
	yellow: init(33, 39),
	blue: init(34, 39),
	magenta: init(35, 39),
	cyan: init(36, 39),
	white: init(37, 39),
	gray: init(90, 39),
	bgBlack: init(40, 49),
	bgRed: init(41, 49),
	bgGreen: init(42, 49),
	bgYellow: init(43, 49),
	bgBlue: init(44, 49),
	bgMagenta: init(45, 49),
	bgCyan: init(46, 49),
	bgWhite: init(47, 49),
	blackBright: init(90, 39),
	redBright: init(91, 39),
	greenBright: init(92, 39),
	yellowBright: init(93, 39),
	blueBright: init(94, 39),
	magentaBright: init(95, 39),
	cyanBright: init(96, 39),
	whiteBright: init(97, 39),
	bgBlackBright: init(100, 49),
	bgRedBright: init(101, 49),
	bgGreenBright: init(102, 49),
	bgYellowBright: init(103, 49),
	bgBlueBright: init(104, 49),
	bgMagentaBright: init(105, 49),
	bgCyanBright: init(106, 49),
	bgWhiteBright: init(107, 49)
};
function createColors(useColor = isColorSupported) {
	return useColor ? colorDefs : Object.fromEntries(Object.keys(colorDefs).map((key) => [key, String]));
}
const colors = createColors();
function getColor$1(color, fallback = "reset") {
	return colors[color] || colors[fallback];
}
const ansiRegex$1 = [String.raw`[\u001B\u009B][[\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\d\/#&.:=?%@~_]+)*|[a-zA-Z\d]+(?:;[-a-zA-Z\d\/#&.:=?%@~_]*)*)?\u0007)`, String.raw`(?:(?:\d{1,4}(?:;\d{0,4})*)?[\dA-PR-TZcf-nq-uy=><~]))`].join("|");
function stripAnsi(text) {
	return text.replace(new RegExp(ansiRegex$1, "g"), "");
}
const boxStylePresets = {
	solid: {
		tl: "┌",
		tr: "┐",
		bl: "└",
		br: "┘",
		h: "─",
		v: "│"
	},
	double: {
		tl: "╔",
		tr: "╗",
		bl: "╚",
		br: "╝",
		h: "═",
		v: "║"
	},
	doubleSingle: {
		tl: "╓",
		tr: "╖",
		bl: "╙",
		br: "╜",
		h: "─",
		v: "║"
	},
	doubleSingleRounded: {
		tl: "╭",
		tr: "╮",
		bl: "╰",
		br: "╯",
		h: "─",
		v: "║"
	},
	singleThick: {
		tl: "┏",
		tr: "┓",
		bl: "┗",
		br: "┛",
		h: "━",
		v: "┃"
	},
	singleDouble: {
		tl: "╒",
		tr: "╕",
		bl: "╘",
		br: "╛",
		h: "═",
		v: "│"
	},
	singleDoubleRounded: {
		tl: "╭",
		tr: "╮",
		bl: "╰",
		br: "╯",
		h: "═",
		v: "│"
	},
	rounded: {
		tl: "╭",
		tr: "╮",
		bl: "╰",
		br: "╯",
		h: "─",
		v: "│"
	}
};
const defaultStyle = {
	borderColor: "white",
	borderStyle: "rounded",
	valign: "center",
	padding: 2,
	marginLeft: 1,
	marginTop: 1,
	marginBottom: 1
};
function box(text, _opts = {}) {
	const opts = {
		..._opts,
		style: {
			...defaultStyle,
			..._opts.style
		}
	};
	const textLines = text.split("\n");
	const boxLines = [];
	const _color = getColor$1(opts.style.borderColor);
	const borderStyle = { ...typeof opts.style.borderStyle === "string" ? boxStylePresets[opts.style.borderStyle] || boxStylePresets.solid : opts.style.borderStyle };
	if (_color) for (const key in borderStyle) borderStyle[key] = _color(borderStyle[key]);
	const paddingOffset = opts.style.padding % 2 === 0 ? opts.style.padding : opts.style.padding + 1;
	const height = textLines.length + paddingOffset;
	const width = Math.max(...textLines.map((line) => stripAnsi(line).length), opts.title ? stripAnsi(opts.title).length : 0) + paddingOffset;
	const widthOffset = width + paddingOffset;
	const leftSpace = opts.style.marginLeft > 0 ? " ".repeat(opts.style.marginLeft) : "";
	if (opts.style.marginTop > 0) boxLines.push("".repeat(opts.style.marginTop));
	if (opts.title) {
		const title = _color ? _color(opts.title) : opts.title;
		const left = borderStyle.h.repeat(Math.floor((width - stripAnsi(opts.title).length) / 2));
		const right = borderStyle.h.repeat(width - stripAnsi(opts.title).length - stripAnsi(left).length + paddingOffset);
		boxLines.push(`${leftSpace}${borderStyle.tl}${left}${title}${right}${borderStyle.tr}`);
	} else boxLines.push(`${leftSpace}${borderStyle.tl}${borderStyle.h.repeat(widthOffset)}${borderStyle.tr}`);
	const valignOffset = opts.style.valign === "center" ? Math.floor((height - textLines.length) / 2) : opts.style.valign === "top" ? height - textLines.length - paddingOffset : height - textLines.length;
	for (let i$1 = 0; i$1 < height; i$1++) if (i$1 < valignOffset || i$1 >= valignOffset + textLines.length) boxLines.push(`${leftSpace}${borderStyle.v}${" ".repeat(widthOffset)}${borderStyle.v}`);
	else {
		const line = textLines[i$1 - valignOffset];
		const left = " ".repeat(paddingOffset);
		const right = " ".repeat(width - stripAnsi(line).length);
		boxLines.push(`${leftSpace}${borderStyle.v}${left}${line}${right}${borderStyle.v}`);
	}
	boxLines.push(`${leftSpace}${borderStyle.bl}${borderStyle.h.repeat(widthOffset)}${borderStyle.br}`);
	if (opts.style.marginBottom > 0) boxLines.push("".repeat(opts.style.marginBottom));
	return boxLines.join("\n");
}
const r = Object.create(null), i = (e) => globalThis.process?.env || import.meta.env || globalThis.Deno?.env.toObject() || globalThis.__env__ || (e ? r : globalThis), o = new Proxy(r, {
	get(e, s$1) {
		return i()[s$1] ?? r[s$1];
	},
	has(e, s$1) {
		return s$1 in i() || s$1 in r;
	},
	set(e, s$1, E) {
		const B = i(true);
		return B[s$1] = E, true;
	},
	deleteProperty(e, s$1) {
		if (!s$1) return false;
		const E = i(true);
		return delete E[s$1], true;
	},
	ownKeys() {
		const e = i(true);
		return Object.keys(e);
	}
}), t = typeof process < "u" && process.env && process.env.NODE_ENV || "", f = [
	["APPVEYOR"],
	[
		"AWS_AMPLIFY",
		"AWS_APP_ID",
		{ ci: true }
	],
	["AZURE_PIPELINES", "SYSTEM_TEAMFOUNDATIONCOLLECTIONURI"],
	["AZURE_STATIC", "INPUT_AZURE_STATIC_WEB_APPS_API_TOKEN"],
	["APPCIRCLE", "AC_APPCIRCLE"],
	["BAMBOO", "bamboo_planKey"],
	["BITBUCKET", "BITBUCKET_COMMIT"],
	["BITRISE", "BITRISE_IO"],
	["BUDDY", "BUDDY_WORKSPACE_ID"],
	["BUILDKITE"],
	["CIRCLE", "CIRCLECI"],
	["CIRRUS", "CIRRUS_CI"],
	[
		"CLOUDFLARE_PAGES",
		"CF_PAGES",
		{ ci: true }
	],
	["CODEBUILD", "CODEBUILD_BUILD_ARN"],
	["CODEFRESH", "CF_BUILD_ID"],
	["DRONE"],
	["DRONE", "DRONE_BUILD_EVENT"],
	["DSARI"],
	["GITHUB_ACTIONS"],
	["GITLAB", "GITLAB_CI"],
	["GITLAB", "CI_MERGE_REQUEST_ID"],
	["GOCD", "GO_PIPELINE_LABEL"],
	["LAYERCI"],
	["HUDSON", "HUDSON_URL"],
	["JENKINS", "JENKINS_URL"],
	["MAGNUM"],
	["NETLIFY"],
	[
		"NETLIFY",
		"NETLIFY_LOCAL",
		{ ci: false }
	],
	["NEVERCODE"],
	["RENDER"],
	["SAIL", "SAILCI"],
	["SEMAPHORE"],
	["SCREWDRIVER"],
	["SHIPPABLE"],
	["SOLANO", "TDDIUM"],
	["STRIDER"],
	["TEAMCITY", "TEAMCITY_VERSION"],
	["TRAVIS"],
	["VERCEL", "NOW_BUILDER"],
	[
		"VERCEL",
		"VERCEL",
		{ ci: false }
	],
	[
		"VERCEL",
		"VERCEL_ENV",
		{ ci: false }
	],
	["APPCENTER", "APPCENTER_BUILD_ID"],
	[
		"CODESANDBOX",
		"CODESANDBOX_SSE",
		{ ci: false }
	],
	[
		"CODESANDBOX",
		"CODESANDBOX_HOST",
		{ ci: false }
	],
	["STACKBLITZ"],
	["STORMKIT"],
	["CLEAVR"],
	["ZEABUR"],
	[
		"CODESPHERE",
		"CODESPHERE_APP_ID",
		{ ci: true }
	],
	["RAILWAY", "RAILWAY_PROJECT_ID"],
	["RAILWAY", "RAILWAY_SERVICE_ID"],
	["DENO-DEPLOY", "DENO_DEPLOYMENT_ID"],
	[
		"FIREBASE_APP_HOSTING",
		"FIREBASE_APP_HOSTING",
		{ ci: true }
	]
];
function b$1() {
	if (globalThis.process?.env) for (const e of f) {
		const s$1 = e[1] || e[0];
		if (globalThis.process?.env[s$1]) return {
			name: e[0].toLowerCase(),
			...e[2]
		};
	}
	return globalThis.process?.env?.SHELL === "/bin/jsh" && globalThis.process?.versions?.webcontainer ? {
		name: "stackblitz",
		ci: false
	} : {
		name: "",
		ci: false
	};
}
const l = b$1();
l.name;
function n(e) {
	return e ? e !== "false" : false;
}
const I = globalThis.process?.platform || "", T = n(o.CI) || l.ci !== false, a$1 = n(globalThis.process?.stdout && globalThis.process?.stdout.isTTY), g = n(o.DEBUG), R = t === "test" || n(o.TEST);
n(o.MINIMAL);
const A = /^win/i.test(I);
!n(o.NO_COLOR) && (n(o.FORCE_COLOR) || (a$1 || A) && o.TERM);
const C = (globalThis.process?.versions?.node || "").replace(/^v/, "") || null;
Number(C?.split(".")[0]);
const y = globalThis.process || Object.create(null), _ = { versions: {} };
new Proxy(y, { get(e, s$1) {
	if (s$1 === "env") return o;
	if (s$1 in e) return e[s$1];
	if (s$1 in _) return _[s$1];
} });
const c = globalThis.process?.release?.name === "node", O = !!globalThis.Bun || !!globalThis.process?.versions?.bun, D = !!globalThis.Deno, L = !!globalThis.fastly, S = !!globalThis.Netlify, u = !!globalThis.EdgeRuntime, N = globalThis.navigator?.userAgent === "Cloudflare-Workers", F = [
	[S, "netlify"],
	[u, "edge-light"],
	[N, "workerd"],
	[L, "fastly"],
	[D, "deno"],
	[O, "bun"],
	[c, "node"]
];
function G() {
	const e = F.find((s$1) => s$1[0]);
	if (e) return { name: e[1] };
}
G()?.name;
function ansiRegex({ onlyFirst = false } = {}) {
	const pattern = [`[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?(?:\\u0007|\\u001B\\u005C|\\u009C))`, "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))"].join("|");
	return new RegExp(pattern, onlyFirst ? void 0 : "g");
}
const regex = ansiRegex();
function stripAnsi$1(string$1) {
	if (typeof string$1 !== "string") throw new TypeError(`Expected a \`string\`, got \`${typeof string$1}\``);
	return string$1.replace(regex, "");
}
function isAmbiguous(x) {
	return x === 161 || x === 164 || x === 167 || x === 168 || x === 170 || x === 173 || x === 174 || x >= 176 && x <= 180 || x >= 182 && x <= 186 || x >= 188 && x <= 191 || x === 198 || x === 208 || x === 215 || x === 216 || x >= 222 && x <= 225 || x === 230 || x >= 232 && x <= 234 || x === 236 || x === 237 || x === 240 || x === 242 || x === 243 || x >= 247 && x <= 250 || x === 252 || x === 254 || x === 257 || x === 273 || x === 275 || x === 283 || x === 294 || x === 295 || x === 299 || x >= 305 && x <= 307 || x === 312 || x >= 319 && x <= 322 || x === 324 || x >= 328 && x <= 331 || x === 333 || x === 338 || x === 339 || x === 358 || x === 359 || x === 363 || x === 462 || x === 464 || x === 466 || x === 468 || x === 470 || x === 472 || x === 474 || x === 476 || x === 593 || x === 609 || x === 708 || x === 711 || x >= 713 && x <= 715 || x === 717 || x === 720 || x >= 728 && x <= 731 || x === 733 || x === 735 || x >= 768 && x <= 879 || x >= 913 && x <= 929 || x >= 931 && x <= 937 || x >= 945 && x <= 961 || x >= 963 && x <= 969 || x === 1025 || x >= 1040 && x <= 1103 || x === 1105 || x === 8208 || x >= 8211 && x <= 8214 || x === 8216 || x === 8217 || x === 8220 || x === 8221 || x >= 8224 && x <= 8226 || x >= 8228 && x <= 8231 || x === 8240 || x === 8242 || x === 8243 || x === 8245 || x === 8251 || x === 8254 || x === 8308 || x === 8319 || x >= 8321 && x <= 8324 || x === 8364 || x === 8451 || x === 8453 || x === 8457 || x === 8467 || x === 8470 || x === 8481 || x === 8482 || x === 8486 || x === 8491 || x === 8531 || x === 8532 || x >= 8539 && x <= 8542 || x >= 8544 && x <= 8555 || x >= 8560 && x <= 8569 || x === 8585 || x >= 8592 && x <= 8601 || x === 8632 || x === 8633 || x === 8658 || x === 8660 || x === 8679 || x === 8704 || x === 8706 || x === 8707 || x === 8711 || x === 8712 || x === 8715 || x === 8719 || x === 8721 || x === 8725 || x === 8730 || x >= 8733 && x <= 8736 || x === 8739 || x === 8741 || x >= 8743 && x <= 8748 || x === 8750 || x >= 8756 && x <= 8759 || x === 8764 || x === 8765 || x === 8776 || x === 8780 || x === 8786 || x === 8800 || x === 8801 || x >= 8804 && x <= 8807 || x === 8810 || x === 8811 || x === 8814 || x === 8815 || x === 8834 || x === 8835 || x === 8838 || x === 8839 || x === 8853 || x === 8857 || x === 8869 || x === 8895 || x === 8978 || x >= 9312 && x <= 9449 || x >= 9451 && x <= 9547 || x >= 9552 && x <= 9587 || x >= 9600 && x <= 9615 || x >= 9618 && x <= 9621 || x === 9632 || x === 9633 || x >= 9635 && x <= 9641 || x === 9650 || x === 9651 || x === 9654 || x === 9655 || x === 9660 || x === 9661 || x === 9664 || x === 9665 || x >= 9670 && x <= 9672 || x === 9675 || x >= 9678 && x <= 9681 || x >= 9698 && x <= 9701 || x === 9711 || x === 9733 || x === 9734 || x === 9737 || x === 9742 || x === 9743 || x === 9756 || x === 9758 || x === 9792 || x === 9794 || x === 9824 || x === 9825 || x >= 9827 && x <= 9829 || x >= 9831 && x <= 9834 || x === 9836 || x === 9837 || x === 9839 || x === 9886 || x === 9887 || x === 9919 || x >= 9926 && x <= 9933 || x >= 9935 && x <= 9939 || x >= 9941 && x <= 9953 || x === 9955 || x === 9960 || x === 9961 || x >= 9963 && x <= 9969 || x === 9972 || x >= 9974 && x <= 9977 || x === 9979 || x === 9980 || x === 9982 || x === 9983 || x === 10045 || x >= 10102 && x <= 10111 || x >= 11094 && x <= 11097 || x >= 12872 && x <= 12879 || x >= 57344 && x <= 63743 || x >= 65024 && x <= 65039 || x === 65533 || x >= 127232 && x <= 127242 || x >= 127248 && x <= 127277 || x >= 127280 && x <= 127337 || x >= 127344 && x <= 127373 || x === 127375 || x === 127376 || x >= 127387 && x <= 127404 || x >= 917760 && x <= 917999 || x >= 983040 && x <= 1048573 || x >= 1048576 && x <= 1114109;
}
function isFullWidth(x) {
	return x === 12288 || x >= 65281 && x <= 65376 || x >= 65504 && x <= 65510;
}
function isWide(x) {
	return x >= 4352 && x <= 4447 || x === 8986 || x === 8987 || x === 9001 || x === 9002 || x >= 9193 && x <= 9196 || x === 9200 || x === 9203 || x === 9725 || x === 9726 || x === 9748 || x === 9749 || x >= 9776 && x <= 9783 || x >= 9800 && x <= 9811 || x === 9855 || x >= 9866 && x <= 9871 || x === 9875 || x === 9889 || x === 9898 || x === 9899 || x === 9917 || x === 9918 || x === 9924 || x === 9925 || x === 9934 || x === 9940 || x === 9962 || x === 9970 || x === 9971 || x === 9973 || x === 9978 || x === 9981 || x === 9989 || x === 9994 || x === 9995 || x === 10024 || x === 10060 || x === 10062 || x >= 10067 && x <= 10069 || x === 10071 || x >= 10133 && x <= 10135 || x === 10160 || x === 10175 || x === 11035 || x === 11036 || x === 11088 || x === 11093 || x >= 11904 && x <= 11929 || x >= 11931 && x <= 12019 || x >= 12032 && x <= 12245 || x >= 12272 && x <= 12287 || x >= 12289 && x <= 12350 || x >= 12353 && x <= 12438 || x >= 12441 && x <= 12543 || x >= 12549 && x <= 12591 || x >= 12593 && x <= 12686 || x >= 12688 && x <= 12773 || x >= 12783 && x <= 12830 || x >= 12832 && x <= 12871 || x >= 12880 && x <= 42124 || x >= 42128 && x <= 42182 || x >= 43360 && x <= 43388 || x >= 44032 && x <= 55203 || x >= 63744 && x <= 64255 || x >= 65040 && x <= 65049 || x >= 65072 && x <= 65106 || x >= 65108 && x <= 65126 || x >= 65128 && x <= 65131 || x >= 94176 && x <= 94180 || x === 94192 || x === 94193 || x >= 94208 && x <= 100343 || x >= 100352 && x <= 101589 || x >= 101631 && x <= 101640 || x >= 110576 && x <= 110579 || x >= 110581 && x <= 110587 || x === 110589 || x === 110590 || x >= 110592 && x <= 110882 || x === 110898 || x >= 110928 && x <= 110930 || x === 110933 || x >= 110948 && x <= 110951 || x >= 110960 && x <= 111355 || x >= 119552 && x <= 119638 || x >= 119648 && x <= 119670 || x === 126980 || x === 127183 || x === 127374 || x >= 127377 && x <= 127386 || x >= 127488 && x <= 127490 || x >= 127504 && x <= 127547 || x >= 127552 && x <= 127560 || x === 127568 || x === 127569 || x >= 127584 && x <= 127589 || x >= 127744 && x <= 127776 || x >= 127789 && x <= 127797 || x >= 127799 && x <= 127868 || x >= 127870 && x <= 127891 || x >= 127904 && x <= 127946 || x >= 127951 && x <= 127955 || x >= 127968 && x <= 127984 || x === 127988 || x >= 127992 && x <= 128062 || x === 128064 || x >= 128066 && x <= 128252 || x >= 128255 && x <= 128317 || x >= 128331 && x <= 128334 || x >= 128336 && x <= 128359 || x === 128378 || x === 128405 || x === 128406 || x === 128420 || x >= 128507 && x <= 128591 || x >= 128640 && x <= 128709 || x === 128716 || x >= 128720 && x <= 128722 || x >= 128725 && x <= 128727 || x >= 128732 && x <= 128735 || x === 128747 || x === 128748 || x >= 128756 && x <= 128764 || x >= 128992 && x <= 129003 || x === 129008 || x >= 129292 && x <= 129338 || x >= 129340 && x <= 129349 || x >= 129351 && x <= 129535 || x >= 129648 && x <= 129660 || x >= 129664 && x <= 129673 || x >= 129679 && x <= 129734 || x >= 129742 && x <= 129756 || x >= 129759 && x <= 129769 || x >= 129776 && x <= 129784 || x >= 131072 && x <= 196605 || x >= 196608 && x <= 262141;
}
function validate(codePoint) {
	if (!Number.isSafeInteger(codePoint)) throw new TypeError(`Expected a code point, got \`${typeof codePoint}\`.`);
}
function eastAsianWidth(codePoint, { ambiguousAsWide = false } = {}) {
	validate(codePoint);
	if (isFullWidth(codePoint) || isWide(codePoint) || ambiguousAsWide && isAmbiguous(codePoint)) return 2;
	return 1;
}
const emojiRegex = () => {
	return /[#*0-9]\uFE0F?\u20E3|[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23ED-\u23EF\u23F1\u23F2\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692\u2694-\u2697\u2699\u269B\u269C\u26A0\u26A7\u26AA\u26B0\u26B1\u26BD\u26BE\u26C4\u26C8\u26CF\u26D1\u26E9\u26F0-\u26F5\u26F7\u26F8\u26FA\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2757\u2763\u27A1\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B55\u3030\u303D\u3297\u3299]\uFE0F?|[\u261D\u270C\u270D](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?|[\u270A\u270B](?:\uD83C[\uDFFB-\uDFFF])?|[\u23E9-\u23EC\u23F0\u23F3\u25FD\u2693\u26A1\u26AB\u26C5\u26CE\u26D4\u26EA\u26FD\u2705\u2728\u274C\u274E\u2753-\u2755\u2795-\u2797\u27B0\u27BF\u2B50]|\u26D3\uFE0F?(?:\u200D\uD83D\uDCA5)?|\u26F9(?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|\u2764\uFE0F?(?:\u200D(?:\uD83D\uDD25|\uD83E\uDE79))?|\uD83C(?:[\uDC04\uDD70\uDD71\uDD7E\uDD7F\uDE02\uDE37\uDF21\uDF24-\uDF2C\uDF36\uDF7D\uDF96\uDF97\uDF99-\uDF9B\uDF9E\uDF9F\uDFCD\uDFCE\uDFD4-\uDFDF\uDFF5\uDFF7]\uFE0F?|[\uDF85\uDFC2\uDFC7](?:\uD83C[\uDFFB-\uDFFF])?|[\uDFC4\uDFCA](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDFCB\uDFCC](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDCCF\uDD8E\uDD91-\uDD9A\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF43\uDF45-\uDF4A\uDF4C-\uDF7C\uDF7E-\uDF84\uDF86-\uDF93\uDFA0-\uDFC1\uDFC5\uDFC6\uDFC8\uDFC9\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF8-\uDFFF]|\uDDE6\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF]|\uDDE7\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF]|\uDDE8\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF7\uDDFA-\uDDFF]|\uDDE9\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF]|\uDDEA\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA]|\uDDEB\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7]|\uDDEC\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE]|\uDDED\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA]|\uDDEE\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9]|\uDDEF\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5]|\uDDF0\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF]|\uDDF1\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE]|\uDDF2\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF]|\uDDF3\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF]|\uDDF4\uD83C\uDDF2|\uDDF5\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE]|\uDDF6\uD83C\uDDE6|\uDDF7\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC]|\uDDF8\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF]|\uDDF9\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF]|\uDDFA\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF]|\uDDFB\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA]|\uDDFC\uD83C[\uDDEB\uDDF8]|\uDDFD\uD83C\uDDF0|\uDDFE\uD83C[\uDDEA\uDDF9]|\uDDFF\uD83C[\uDDE6\uDDF2\uDDFC]|\uDF44(?:\u200D\uD83D\uDFEB)?|\uDF4B(?:\u200D\uD83D\uDFE9)?|\uDFC3(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDFF3\uFE0F?(?:\u200D(?:\u26A7\uFE0F?|\uD83C\uDF08))?|\uDFF4(?:\u200D\u2620\uFE0F?|\uDB40\uDC67\uDB40\uDC62\uDB40(?:\uDC65\uDB40\uDC6E\uDB40\uDC67|\uDC73\uDB40\uDC63\uDB40\uDC74|\uDC77\uDB40\uDC6C\uDB40\uDC73)\uDB40\uDC7F)?)|\uD83D(?:[\uDC3F\uDCFD\uDD49\uDD4A\uDD6F\uDD70\uDD73\uDD76-\uDD79\uDD87\uDD8A-\uDD8D\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA\uDECB\uDECD-\uDECF\uDEE0-\uDEE5\uDEE9\uDEF0\uDEF3]\uFE0F?|[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC](?:\uD83C[\uDFFB-\uDFFF])?|[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4\uDEB5](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD74\uDD90](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?|[\uDC00-\uDC07\uDC09-\uDC14\uDC16-\uDC25\uDC27-\uDC3A\uDC3C-\uDC3E\uDC40\uDC44\uDC45\uDC51-\uDC65\uDC6A\uDC79-\uDC7B\uDC7D-\uDC80\uDC84\uDC88-\uDC8E\uDC90\uDC92-\uDCA9\uDCAB-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDDA4\uDDFB-\uDE2D\uDE2F-\uDE34\uDE37-\uDE41\uDE43\uDE44\uDE48-\uDE4A\uDE80-\uDEA2\uDEA4-\uDEB3\uDEB7-\uDEBF\uDEC1-\uDEC5\uDED0-\uDED2\uDED5-\uDED7\uDEDC-\uDEDF\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB\uDFF0]|\uDC08(?:\u200D\u2B1B)?|\uDC15(?:\u200D\uD83E\uDDBA)?|\uDC26(?:\u200D(?:\u2B1B|\uD83D\uDD25))?|\uDC3B(?:\u200D\u2744\uFE0F?)?|\uDC41\uFE0F?(?:\u200D\uD83D\uDDE8\uFE0F?)?|\uDC68(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDC68\uDC69]\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFE])))?))?|\uDC69(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?[\uDC68\uDC69]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?|\uDC69\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?))|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFE])))?))?|\uDC6F(?:\u200D[\u2640\u2642]\uFE0F?)?|\uDD75(?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|\uDE2E(?:\u200D\uD83D\uDCA8)?|\uDE35(?:\u200D\uD83D\uDCAB)?|\uDE36(?:\u200D\uD83C\uDF2B\uFE0F?)?|\uDE42(?:\u200D[\u2194\u2195]\uFE0F?)?|\uDEB6(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?)|\uD83E(?:[\uDD0C\uDD0F\uDD18-\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5\uDEC3-\uDEC5\uDEF0\uDEF2-\uDEF8](?:\uD83C[\uDFFB-\uDFFF])?|[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD\uDDCF\uDDD4\uDDD6-\uDDDD](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDDDE\uDDDF](?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD0D\uDD0E\uDD10-\uDD17\uDD20-\uDD25\uDD27-\uDD2F\uDD3A\uDD3F-\uDD45\uDD47-\uDD76\uDD78-\uDDB4\uDDB7\uDDBA\uDDBC-\uDDCC\uDDD0\uDDE0-\uDDFF\uDE70-\uDE7C\uDE80-\uDE89\uDE8F-\uDEC2\uDEC6\uDECE-\uDEDC\uDEDF-\uDEE9]|\uDD3C(?:\u200D[\u2640\u2642]\uFE0F?|\uD83C[\uDFFB-\uDFFF])?|\uDDCE(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDDD1(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1|\uDDD1\u200D\uD83E\uDDD2(?:\u200D\uD83E\uDDD2)?|\uDDD2(?:\u200D\uD83E\uDDD2)?))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?))?|\uDEF1(?:\uD83C(?:\uDFFB(?:\u200D\uD83E\uDEF2\uD83C[\uDFFC-\uDFFF])?|\uDFFC(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFD-\uDFFF])?|\uDFFD(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])?|\uDFFE(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFD\uDFFF])?|\uDFFF(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFE])?))?)/g;
};
const segmenter = globalThis.Intl?.Segmenter ? new Intl.Segmenter() : { segment: (str) => str.split("") };
const defaultIgnorableCodePointRegex = /^\p{Default_Ignorable_Code_Point}$/u;
function stringWidth$1(string$1, options = {}) {
	if (typeof string$1 !== "string" || string$1.length === 0) return 0;
	const { ambiguousIsNarrow = true, countAnsiEscapeCodes = false } = options;
	if (!countAnsiEscapeCodes) string$1 = stripAnsi$1(string$1);
	if (string$1.length === 0) return 0;
	let width = 0;
	const eastAsianWidthOptions = { ambiguousAsWide: !ambiguousIsNarrow };
	for (const { segment: character } of segmenter.segment(string$1)) {
		const codePoint = character.codePointAt(0);
		if (codePoint <= 31 || codePoint >= 127 && codePoint <= 159) continue;
		if (codePoint >= 8203 && codePoint <= 8207 || codePoint === 65279) continue;
		if (codePoint >= 768 && codePoint <= 879 || codePoint >= 6832 && codePoint <= 6911 || codePoint >= 7616 && codePoint <= 7679 || codePoint >= 8400 && codePoint <= 8447 || codePoint >= 65056 && codePoint <= 65071) continue;
		if (codePoint >= 55296 && codePoint <= 57343) continue;
		if (codePoint >= 65024 && codePoint <= 65039) continue;
		if (defaultIgnorableCodePointRegex.test(character)) continue;
		if (emojiRegex().test(character)) {
			width += 2;
			continue;
		}
		width += eastAsianWidth(codePoint, eastAsianWidthOptions);
	}
	return width;
}
function isUnicodeSupported() {
	const { env: env$3 } = process$1;
	const { TERM, TERM_PROGRAM } = env$3;
	if (process$1.platform !== "win32") return TERM !== "linux";
	return Boolean(env$3.WT_SESSION) || Boolean(env$3.TERMINUS_SUBLIME) || env$3.ConEmuTask === "{cmd::Cmder}" || TERM_PROGRAM === "Terminus-Sublime" || TERM_PROGRAM === "vscode" || TERM === "xterm-256color" || TERM === "alacritty" || TERM === "rxvt-unicode" || TERM === "rxvt-unicode-256color" || env$3.TERMINAL_EMULATOR === "JetBrains-JediTerm";
}
const TYPE_COLOR_MAP = {
	info: "cyan",
	fail: "red",
	success: "green",
	ready: "green",
	start: "magenta"
};
const LEVEL_COLOR_MAP = {
	0: "red",
	1: "yellow"
};
const unicode = isUnicodeSupported();
const s = (c$1, fallback) => unicode ? c$1 : fallback;
const TYPE_ICONS = {
	error: s("✖", "×"),
	fatal: s("✖", "×"),
	ready: s("✔", "√"),
	warn: s("⚠", "‼"),
	info: s("ℹ", "i"),
	success: s("✔", "√"),
	debug: s("⚙", "D"),
	trace: s("→", "→"),
	fail: s("✖", "×"),
	start: s("◐", "o"),
	log: ""
};
function stringWidth(str) {
	if (!(typeof Intl === "object") || !Intl.Segmenter) return stripAnsi(str).length;
	return stringWidth$1(str);
}
var FancyReporter = class extends BasicReporter {
	formatStack(stack, message, opts) {
		const indent = "  ".repeat((opts?.errorLevel || 0) + 1);
		return `
${indent}` + parseStack(stack, message).map((line) => "  " + line.replace(/^at +/, (m$1) => colors.gray(m$1)).replace(/\((.+)\)/, (_$1, m$1) => `(${colors.cyan(m$1)})`)).join(`
${indent}`);
	}
	formatType(logObj, isBadge, opts) {
		const typeColor = TYPE_COLOR_MAP[logObj.type] || LEVEL_COLOR_MAP[logObj.level] || "gray";
		if (isBadge) return getBgColor(typeColor)(colors.black(` ${logObj.type.toUpperCase()} `));
		const _type = typeof TYPE_ICONS[logObj.type] === "string" ? TYPE_ICONS[logObj.type] : logObj.icon || logObj.type;
		return _type ? getColor(typeColor)(_type) : "";
	}
	formatLogObj(logObj, opts) {
		const [message, ...additional] = this.formatArgs(logObj.args, opts).split("\n");
		if (logObj.type === "box") return box(characterFormat(message + (additional.length > 0 ? "\n" + additional.join("\n") : "")), {
			title: logObj.title ? characterFormat(logObj.title) : void 0,
			style: logObj.style
		});
		const date = this.formatDate(logObj.date, opts);
		const coloredDate = date && colors.gray(date);
		const isBadge = logObj.badge ?? logObj.level < 2;
		const type = this.formatType(logObj, isBadge, opts);
		const tag = logObj.tag ? colors.gray(logObj.tag) : "";
		let line;
		const left = this.filterAndJoin([type, characterFormat(message)]);
		const right = this.filterAndJoin(opts.columns ? [tag, coloredDate] : [tag]);
		const space = (opts.columns || 0) - stringWidth(left) - stringWidth(right) - 2;
		line = space > 0 && (opts.columns || 0) >= 80 ? left + " ".repeat(space) + right : (right ? `${colors.gray(`[${right}]`)} ` : "") + left;
		line += characterFormat(additional.length > 0 ? "\n" + additional.join("\n") : "");
		if (logObj.type === "trace") {
			const _err = /* @__PURE__ */ new Error("Trace: " + logObj.message);
			line += this.formatStack(_err.stack || "", _err.message);
		}
		return isBadge ? "\n" + line + "\n" : line;
	}
};
function characterFormat(str) {
	return str.replace(/`([^`]+)`/gm, (_$1, m$1) => colors.cyan(m$1)).replace(/\s+_([^_]+)_\s+/gm, (_$1, m$1) => ` ${colors.underline(m$1)} `);
}
function getColor(color = "white") {
	return colors[color] || colors.white;
}
function getBgColor(color = "bgWhite") {
	return colors[`bg${color[0].toUpperCase()}${color.slice(1)}`] || colors.bgWhite;
}
function createConsola$1(options = {}) {
	let level$1 = _getDefaultLogLevel();
	if (process.env.CONSOLA_LEVEL) level$1 = Number.parseInt(process.env.CONSOLA_LEVEL) ?? level$1;
	return createConsola({
		level: level$1,
		defaults: { level: level$1 },
		stdout: process.stdout,
		stderr: process.stderr,
		prompt: (...args) => import("./prompt-aUb0trKM.js").then((m$1) => m$1.prompt(...args)),
		reporters: options.reporters || [options.fancy ?? !(T || R) ? new FancyReporter() : new BasicReporter()],
		...options
	});
}
function _getDefaultLogLevel() {
	if (g) return LogLevels.debug;
	if (R) return LogLevels.warn;
	return LogLevels.info;
}
const consola = createConsola$1();
function createLogger$1(name$1) {
	const logger$1 = consola.withTag(name$1);
	if (process$1.env.LOG_LEVEL != null) {
		const level$1 = Number.parseInt(process$1.env.LOG_LEVEL, 10);
		if (!Number.isNaN(level$1)) logger$1.level = level$1;
	}
	return logger$1;
}
const log$1 = console.log;
const logger = createLogger$1(name);
const log = log$1;
function ensureNumber(value) {
	return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
function normalizeRawUsage(value) {
	if (value == null || typeof value !== "object") return null;
	const record$1 = value;
	const input = ensureNumber(record$1.input_tokens);
	const cached = ensureNumber(record$1.cached_input_tokens ?? record$1.cache_read_input_tokens);
	const output = ensureNumber(record$1.output_tokens);
	const reasoning = ensureNumber(record$1.reasoning_output_tokens);
	const total = ensureNumber(record$1.total_tokens);
	return {
		input_tokens: input,
		cached_input_tokens: cached,
		output_tokens: output,
		reasoning_output_tokens: reasoning,
		total_tokens: total > 0 ? total : input + output
	};
}
function subtractRawUsage(current, previous) {
	return {
		input_tokens: Math.max(current.input_tokens - (previous?.input_tokens ?? 0), 0),
		cached_input_tokens: Math.max(current.cached_input_tokens - (previous?.cached_input_tokens ?? 0), 0),
		output_tokens: Math.max(current.output_tokens - (previous?.output_tokens ?? 0), 0),
		reasoning_output_tokens: Math.max(current.reasoning_output_tokens - (previous?.reasoning_output_tokens ?? 0), 0),
		total_tokens: Math.max(current.total_tokens - (previous?.total_tokens ?? 0), 0)
	};
}
function convertToDelta(raw) {
	const total = raw.total_tokens > 0 ? raw.total_tokens : raw.input_tokens + raw.output_tokens;
	const cached = Math.min(raw.cached_input_tokens, raw.input_tokens);
	return {
		inputTokens: raw.input_tokens,
		cachedInputTokens: cached,
		outputTokens: raw.output_tokens,
		reasoningOutputTokens: raw.reasoning_output_tokens,
		totalTokens: total
	};
}
const recordSchema = /* @__PURE__ */ record(/* @__PURE__ */ string(), /* @__PURE__ */ unknown());
const LEGACY_FALLBACK_MODEL = "gpt-5";
const entrySchema = /* @__PURE__ */ object({
	type: /* @__PURE__ */ string(),
	payload: /* @__PURE__ */ optional(/* @__PURE__ */ unknown()),
	timestamp: /* @__PURE__ */ optional(/* @__PURE__ */ string())
});
const tokenCountPayloadSchema = /* @__PURE__ */ object({
	type: /* @__PURE__ */ literal("token_count"),
	info: /* @__PURE__ */ optional(recordSchema)
});
function extractModel(value) {
	const parsed = /* @__PURE__ */ safeParse(recordSchema, value);
	if (!parsed.success) return;
	const payload = parsed.output;
	const infoCandidate = payload.info;
	if (infoCandidate != null) {
		const infoParsed = /* @__PURE__ */ safeParse(recordSchema, infoCandidate);
		if (infoParsed.success) {
			const info$1 = infoParsed.output;
			const directCandidates = [info$1.model, info$1.model_name];
			for (const candidate of directCandidates) {
				const model = asNonEmptyString(candidate);
				if (model != null) return model;
			}
			if (info$1.metadata != null) {
				const metadataParsed = /* @__PURE__ */ safeParse(recordSchema, info$1.metadata);
				if (metadataParsed.success) {
					const model = asNonEmptyString(metadataParsed.output.model);
					if (model != null) return model;
				}
			}
		}
	}
	const fallbackModel = asNonEmptyString(payload.model);
	if (fallbackModel != null) return fallbackModel;
	if (payload.metadata != null) {
		const metadataParsed = /* @__PURE__ */ safeParse(recordSchema, payload.metadata);
		if (metadataParsed.success) {
			const model = asNonEmptyString(metadataParsed.output.model);
			if (model != null) return model;
		}
	}
}
function asNonEmptyString(value) {
	if (typeof value !== "string") return;
	const trimmed = value.trim();
	return trimmed === "" ? void 0 : trimmed;
}
async function loadTokenUsageEvents(options = {}) {
	const providedDirs = options.sessionDirs != null && options.sessionDirs.length > 0 ? options.sessionDirs.map((dir) => path.resolve(dir)) : void 0;
	const codexHomeEnv = process$1.env[CODEX_HOME_ENV]?.trim();
	const codexHome = codexHomeEnv != null && codexHomeEnv !== "" ? path.resolve(codexHomeEnv) : DEFAULT_CODEX_DIR;
	const defaultSessionsDir = path.join(codexHome, DEFAULT_SESSION_SUBDIR);
	const sessionDirs = providedDirs ?? [defaultSessionsDir];
	const events = [];
	const missingDirectories = [];
	for (const dir of sessionDirs) {
		const directoryPath = path.resolve(dir);
		const statResult = await try_({
			try: stat(directoryPath),
			catch: (error) => error
		});
		if (isFailure(statResult)) {
			missingDirectories.push(directoryPath);
			continue;
		}
		if (!statResult.value.isDirectory()) {
			missingDirectories.push(directoryPath);
			continue;
		}
		const files = await glob(SESSION_GLOB, {
			cwd: directoryPath,
			absolute: true
		});
		for (const file of files) {
			const sessionId = path.relative(directoryPath, file).split(path.sep).join("/").replace(/\.jsonl$/i, "");
			const fileContentResult = await try_({
				try: readFile(file, "utf8"),
				catch: (error) => error
			});
			if (isFailure(fileContentResult)) {
				logger.debug("Failed to read Codex session file", fileContentResult.error);
				continue;
			}
			let previousTotals = null;
			let currentModel;
			let currentModelIsFallback = false;
			let legacyFallbackUsed = false;
			const lines = fileContentResult.value.split(/\r?\n/);
			for (const line of lines) {
				const trimmed = line.trim();
				if (trimmed === "") continue;
				const parsedResult = try_({
					try: () => JSON.parse(trimmed),
					catch: (error) => error
				})();
				if (isFailure(parsedResult)) continue;
				const entryParse = /* @__PURE__ */ safeParse(entrySchema, parsedResult.value);
				if (!entryParse.success) continue;
				const { type: entryType, payload, timestamp } = entryParse.output;
				if (entryType === "turn_context") {
					const contextPayload = /* @__PURE__ */ safeParse(recordSchema, payload ?? null);
					if (contextPayload.success) {
						const contextModel = extractModel(contextPayload.output);
						if (contextModel != null) {
							currentModel = contextModel;
							currentModelIsFallback = false;
						}
					}
					continue;
				}
				if (entryType !== "event_msg") continue;
				const tokenPayloadResult = /* @__PURE__ */ safeParse(tokenCountPayloadSchema, payload ?? void 0);
				if (!tokenPayloadResult.success) continue;
				if (timestamp == null) continue;
				const info$1 = tokenPayloadResult.output.info;
				const lastUsage = normalizeRawUsage(info$1?.last_token_usage);
				const totalUsage = normalizeRawUsage(info$1?.total_token_usage);
				let raw = lastUsage;
				if (raw == null && totalUsage != null) raw = subtractRawUsage(totalUsage, previousTotals);
				if (totalUsage != null) previousTotals = totalUsage;
				if (raw == null) continue;
				const delta = convertToDelta(raw);
				if (delta.inputTokens === 0 && delta.cachedInputTokens === 0 && delta.outputTokens === 0 && delta.reasoningOutputTokens === 0) continue;
				const payloadRecordResult = /* @__PURE__ */ safeParse(recordSchema, payload ?? void 0);
				const extractedModel = extractModel(payloadRecordResult.success ? Object.assign({}, payloadRecordResult.output, { info: info$1 }) : { info: info$1 });
				let isFallbackModel = false;
				if (extractedModel != null) {
					currentModel = extractedModel;
					currentModelIsFallback = false;
				}
				let model = extractedModel ?? currentModel;
				if (model == null) {
					model = LEGACY_FALLBACK_MODEL;
					isFallbackModel = true;
					legacyFallbackUsed = true;
					currentModel = model;
					currentModelIsFallback = true;
				} else if (extractedModel == null && currentModelIsFallback) isFallbackModel = true;
				const event = {
					sessionId,
					timestamp,
					model,
					inputTokens: delta.inputTokens,
					cachedInputTokens: delta.cachedInputTokens,
					outputTokens: delta.outputTokens,
					reasoningOutputTokens: delta.reasoningOutputTokens,
					totalTokens: delta.totalTokens
				};
				if (isFallbackModel) event.isFallbackModel = true;
				events.push(event);
			}
			if (legacyFallbackUsed) logger.debug("Legacy Codex session lacked model metadata; applied fallback", {
				file,
				model: LEGACY_FALLBACK_MODEL
			});
		}
	}
	events.sort((a$2, b$2) => new Date(a$2.timestamp).getTime() - new Date(b$2.timestamp).getTime());
	return {
		events,
		missingDirectories
	};
}
const LITELLM_PRICING_URL = "https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json";
const DEFAULT_TIERED_THRESHOLD = 2e5;
const liteLLMModelPricingSchema = /* @__PURE__ */ object({
	input_cost_per_token: /* @__PURE__ */ optional(/* @__PURE__ */ number()),
	output_cost_per_token: /* @__PURE__ */ optional(/* @__PURE__ */ number()),
	cache_creation_input_token_cost: /* @__PURE__ */ optional(/* @__PURE__ */ number()),
	cache_read_input_token_cost: /* @__PURE__ */ optional(/* @__PURE__ */ number()),
	max_tokens: /* @__PURE__ */ optional(/* @__PURE__ */ number()),
	max_input_tokens: /* @__PURE__ */ optional(/* @__PURE__ */ number()),
	max_output_tokens: /* @__PURE__ */ optional(/* @__PURE__ */ number()),
	input_cost_per_token_above_200k_tokens: /* @__PURE__ */ optional(/* @__PURE__ */ number()),
	output_cost_per_token_above_200k_tokens: /* @__PURE__ */ optional(/* @__PURE__ */ number()),
	cache_creation_input_token_cost_above_200k_tokens: /* @__PURE__ */ optional(/* @__PURE__ */ number()),
	cache_read_input_token_cost_above_200k_tokens: /* @__PURE__ */ optional(/* @__PURE__ */ number()),
	input_cost_per_token_above_128k_tokens: /* @__PURE__ */ optional(/* @__PURE__ */ number()),
	output_cost_per_token_above_128k_tokens: /* @__PURE__ */ optional(/* @__PURE__ */ number()),
	provider_specific_entry: /* @__PURE__ */ optional(/* @__PURE__ */ object({ fast: /* @__PURE__ */ optional(/* @__PURE__ */ number()) }))
});
const DEFAULT_PROVIDER_PREFIXES = [
	"anthropic/",
	"claude-3-5-",
	"claude-3-",
	"claude-",
	"openai/",
	"azure/",
	"openrouter/openai/"
];
function createLogger(logger$1) {
	if (logger$1 != null) return logger$1;
	return {
		debug: () => {},
		error: () => {},
		info: () => {},
		warn: () => {}
	};
}
var LiteLLMPricingFetcher = class {
	cachedPricing = null;
	logger;
	offline;
	offlineLoader;
	url;
	providerPrefixes;
	constructor(options = {}) {
		this.logger = createLogger(options.logger);
		this.offline = Boolean(options.offline);
		this.offlineLoader = options.offlineLoader;
		this.url = options.url ?? LITELLM_PRICING_URL;
		this.providerPrefixes = options.providerPrefixes ?? DEFAULT_PROVIDER_PREFIXES;
	}
	[Symbol.dispose]() {
		this.clearCache();
	}
	clearCache() {
		this.cachedPricing = null;
	}
	loadOfflinePricing = try_({
		try: async () => {
			if (this.offlineLoader == null) throw new Error("Offline loader was not provided");
			const pricing = new Map(Object.entries(await this.offlineLoader()));
			this.cachedPricing = pricing;
			return pricing;
		},
		catch: (error) => new Error("Failed to load offline pricing data", { cause: error })
	});
	async handleFallbackToCachedPricing(originalError) {
		this.logger.warn("Failed to fetch model pricing from LiteLLM, falling back to cached pricing data");
		this.logger.debug("Fetch error details:", originalError);
		return pipe(this.loadOfflinePricing(), inspect((pricing) => {
			this.logger.info(`Using cached pricing data for ${pricing.size} models`);
		}), inspectError((error) => {
			this.logger.error("Failed to load cached pricing data as fallback:", error);
			this.logger.error("Original fetch error:", originalError);
		}));
	}
	async ensurePricingLoaded() {
		return pipe(this.cachedPricing != null ? succeed(this.cachedPricing) : fail(/* @__PURE__ */ new Error("Cached pricing not available")), orElse(async () => {
			if (this.offline) return this.loadOfflinePricing();
			this.logger.warn("Fetching latest model pricing from LiteLLM...");
			return pipe(try_({
				try: fetch(this.url),
				catch: (error) => new Error("Failed to fetch model pricing from LiteLLM", { cause: error })
			}), andThrough((response) => {
				if (!response.ok) return fail(/* @__PURE__ */ new Error(`Failed to fetch pricing data: ${response.statusText}`));
				return succeed();
			}), andThen(async (response) => try_({
				try: response.json(),
				catch: (error) => new Error("Failed to parse pricing data", { cause: error })
			})), map((data) => {
				const pricing = /* @__PURE__ */ new Map();
				for (const [modelName, modelData] of Object.entries(data)) {
					if (typeof modelData !== "object" || modelData == null) continue;
					const parsed = /* @__PURE__ */ safeParse(liteLLMModelPricingSchema, modelData);
					if (!parsed.success) continue;
					pricing.set(modelName, parsed.output);
				}
				return pricing;
			}), inspect((pricing) => {
				this.cachedPricing = pricing;
				this.logger.info(`Loaded pricing for ${pricing.size} models`);
			}), orElse(async (error) => this.handleFallbackToCachedPricing(error)));
		}));
	}
	async fetchModelPricing() {
		return this.ensurePricingLoaded();
	}
	createMatchingCandidates(modelName) {
		const candidates = /* @__PURE__ */ new Set();
		candidates.add(modelName);
		for (const prefix of this.providerPrefixes) candidates.add(`${prefix}${modelName}`);
		return Array.from(candidates);
	}
	async getModelPricing(modelName) {
		return pipe(this.ensurePricingLoaded(), map((pricing) => {
			for (const candidate of this.createMatchingCandidates(modelName)) {
				const direct = pricing.get(candidate);
				if (direct != null) return direct;
			}
			const lower = modelName.toLowerCase();
			for (const [key, value] of pricing) {
				const comparison = key.toLowerCase();
				if (comparison.includes(lower) || lower.includes(comparison)) return value;
			}
			return null;
		}));
	}
	async getModelContextLimit(modelName) {
		return pipe(this.getModelPricing(modelName), map((pricing) => pricing?.max_input_tokens ?? null));
	}
	calculateCostFromPricing(tokens, pricing) {
		const calculateTieredCost = (totalTokens, basePrice, tieredPrice, threshold = DEFAULT_TIERED_THRESHOLD) => {
			if (totalTokens == null || totalTokens <= 0) return 0;
			if (totalTokens > threshold && tieredPrice != null) {
				const tokensBelowThreshold = Math.min(totalTokens, threshold);
				let tieredCost = Math.max(0, totalTokens - threshold) * tieredPrice;
				if (basePrice != null) tieredCost += tokensBelowThreshold * basePrice;
				return tieredCost;
			}
			if (basePrice != null) return totalTokens * basePrice;
			return 0;
		};
		const inputCost = calculateTieredCost(tokens.input_tokens, pricing.input_cost_per_token, pricing.input_cost_per_token_above_200k_tokens);
		const outputCost = calculateTieredCost(tokens.output_tokens, pricing.output_cost_per_token, pricing.output_cost_per_token_above_200k_tokens);
		const cacheCreationCost = calculateTieredCost(tokens.cache_creation_input_tokens, pricing.cache_creation_input_token_cost, pricing.cache_creation_input_token_cost_above_200k_tokens);
		const cacheReadCost = calculateTieredCost(tokens.cache_read_input_tokens, pricing.cache_read_input_token_cost, pricing.cache_read_input_token_cost_above_200k_tokens);
		return inputCost + outputCost + cacheCreationCost + cacheReadCost;
	}
	async calculateCostFromTokens(tokens, modelName, options) {
		if (modelName == null || modelName === "") return succeed(0);
		return pipe(this.getModelPricing(modelName), andThen((pricing) => {
			if (pricing == null) return fail(/* @__PURE__ */ new Error(`Model pricing not found for ${modelName}`));
			return succeed(this.calculateCostFromPricing(tokens, pricing) * (options?.speed === "fast" ? pricing.provider_specific_entry?.fast ?? 1 : 1));
		}));
	}
};
const CODEX_PROVIDER_PREFIXES = [
	"openai/",
	"azure/",
	"openrouter/openai/"
];
const CODEX_MODEL_ALIASES_MAP = new Map([["gpt-5-codex", "gpt-5"], ["gpt-5.3-codex", "gpt-5.2-codex"]]);
const FREE_MODEL_PRICING = {
	inputCostPerMToken: 0,
	cachedInputCostPerMToken: 0,
	outputCostPerMToken: 0
};
function isOpenRouterFreeModel(model) {
	const normalized = model.trim().toLowerCase();
	if (normalized === "openrouter/free") return true;
	return normalized.startsWith("openrouter/") && normalized.endsWith(":free");
}
function hasNonZeroTokenPricing(pricing) {
	return (pricing.input_cost_per_token ?? 0) > 0 || (pricing.output_cost_per_token ?? 0) > 0 || (pricing.cache_read_input_token_cost ?? 0) > 0;
}
function toPerMillion(value, fallback) {
	return (value ?? fallback ?? 0) * MILLION;
}
const PREFETCHED_CODEX_PRICING = {
	"azure/gpt-5.1-2025-11-13": {
		"input_cost_per_token": 125e-8,
		"output_cost_per_token": 1e-5,
		"cache_read_input_token_cost": 125e-9,
		"max_tokens": 128e3,
		"max_input_tokens": 272e3,
		"max_output_tokens": 128e3
	},
	"azure/gpt-5.1-chat-2025-11-13": {
		"input_cost_per_token": 125e-8,
		"output_cost_per_token": 1e-5,
		"cache_read_input_token_cost": 125e-9,
		"max_tokens": 16384,
		"max_input_tokens": 128e3,
		"max_output_tokens": 16384
	},
	"azure/gpt-5.1-codex-2025-11-13": {
		"input_cost_per_token": 125e-8,
		"output_cost_per_token": 1e-5,
		"cache_read_input_token_cost": 125e-9,
		"max_tokens": 128e3,
		"max_input_tokens": 272e3,
		"max_output_tokens": 128e3
	},
	"azure/gpt-5.1-codex-mini-2025-11-13": {
		"input_cost_per_token": 25e-8,
		"output_cost_per_token": 2e-6,
		"cache_read_input_token_cost": 25e-9,
		"max_tokens": 128e3,
		"max_input_tokens": 272e3,
		"max_output_tokens": 128e3
	},
	"azure/gpt-5": {
		"input_cost_per_token": 125e-8,
		"output_cost_per_token": 1e-5,
		"cache_read_input_token_cost": 125e-9,
		"max_tokens": 128e3,
		"max_input_tokens": 272e3,
		"max_output_tokens": 128e3
	},
	"azure/gpt-5-2025-08-07": {
		"input_cost_per_token": 125e-8,
		"output_cost_per_token": 1e-5,
		"cache_read_input_token_cost": 125e-9,
		"max_tokens": 128e3,
		"max_input_tokens": 272e3,
		"max_output_tokens": 128e3
	},
	"azure/gpt-5-chat": {
		"input_cost_per_token": 125e-8,
		"output_cost_per_token": 1e-5,
		"cache_read_input_token_cost": 125e-9,
		"max_tokens": 16384,
		"max_input_tokens": 128e3,
		"max_output_tokens": 16384
	},
	"azure/gpt-5-chat-latest": {
		"input_cost_per_token": 125e-8,
		"output_cost_per_token": 1e-5,
		"cache_read_input_token_cost": 125e-9,
		"max_tokens": 16384,
		"max_input_tokens": 128e3,
		"max_output_tokens": 16384
	},
	"azure/gpt-5-codex": {
		"input_cost_per_token": 125e-8,
		"output_cost_per_token": 1e-5,
		"cache_read_input_token_cost": 125e-9,
		"max_tokens": 128e3,
		"max_input_tokens": 272e3,
		"max_output_tokens": 128e3
	},
	"azure/gpt-5-mini": {
		"input_cost_per_token": 25e-8,
		"output_cost_per_token": 2e-6,
		"cache_read_input_token_cost": 25e-9,
		"max_tokens": 128e3,
		"max_input_tokens": 272e3,
		"max_output_tokens": 128e3
	},
	"azure/gpt-5-mini-2025-08-07": {
		"input_cost_per_token": 25e-8,
		"output_cost_per_token": 2e-6,
		"cache_read_input_token_cost": 25e-9,
		"max_tokens": 128e3,
		"max_input_tokens": 272e3,
		"max_output_tokens": 128e3
	},
	"azure/gpt-5-nano": {
		"input_cost_per_token": 5e-8,
		"output_cost_per_token": 4e-7,
		"cache_read_input_token_cost": 5e-9,
		"max_tokens": 128e3,
		"max_input_tokens": 272e3,
		"max_output_tokens": 128e3
	},
	"azure/gpt-5-nano-2025-08-07": {
		"input_cost_per_token": 5e-8,
		"output_cost_per_token": 4e-7,
		"cache_read_input_token_cost": 5e-9,
		"max_tokens": 128e3,
		"max_input_tokens": 272e3,
		"max_output_tokens": 128e3
	},
	"azure/gpt-5-pro": {
		"input_cost_per_token": 15e-6,
		"output_cost_per_token": 12e-5,
		"max_tokens": 128e3,
		"max_input_tokens": 272e3,
		"max_output_tokens": 128e3
	},
	"azure/gpt-5.1": {
		"input_cost_per_token": 125e-8,
		"output_cost_per_token": 1e-5,
		"cache_read_input_token_cost": 125e-9,
		"max_tokens": 128e3,
		"max_input_tokens": 272e3,
		"max_output_tokens": 128e3
	},
	"azure/gpt-5.1-chat": {
		"input_cost_per_token": 125e-8,
		"output_cost_per_token": 1e-5,
		"cache_read_input_token_cost": 125e-9,
		"max_tokens": 128e3,
		"max_input_tokens": 128e3,
		"max_output_tokens": 128e3
	},
	"azure/gpt-5.1-codex": {
		"input_cost_per_token": 125e-8,
		"output_cost_per_token": 1e-5,
		"cache_read_input_token_cost": 125e-9,
		"max_tokens": 128e3,
		"max_input_tokens": 272e3,
		"max_output_tokens": 128e3
	},
	"azure/gpt-5.1-codex-max": {
		"input_cost_per_token": 125e-8,
		"output_cost_per_token": 1e-5,
		"cache_read_input_token_cost": 125e-9,
		"max_tokens": 128e3,
		"max_input_tokens": 272e3,
		"max_output_tokens": 128e3
	},
	"azure/gpt-5.1-codex-mini": {
		"input_cost_per_token": 25e-8,
		"output_cost_per_token": 2e-6,
		"cache_read_input_token_cost": 25e-9,
		"max_tokens": 128e3,
		"max_input_tokens": 272e3,
		"max_output_tokens": 128e3
	},
	"azure/gpt-5.2": {
		"input_cost_per_token": 175e-8,
		"output_cost_per_token": 14e-6,
		"cache_read_input_token_cost": 175e-9,
		"max_tokens": 128e3,
		"max_input_tokens": 272e3,
		"max_output_tokens": 128e3
	},
	"azure/gpt-5.2-2025-12-11": {
		"input_cost_per_token": 175e-8,
		"output_cost_per_token": 14e-6,
		"cache_read_input_token_cost": 175e-9,
		"max_tokens": 128e3,
		"max_input_tokens": 272e3,
		"max_output_tokens": 128e3
	},
	"azure/gpt-5.2-chat": {
		"input_cost_per_token": 175e-8,
		"output_cost_per_token": 14e-6,
		"cache_read_input_token_cost": 175e-9,
		"max_tokens": 16384,
		"max_input_tokens": 128e3,
		"max_output_tokens": 16384
	},
	"azure/gpt-5.2-chat-2025-12-11": {
		"input_cost_per_token": 175e-8,
		"output_cost_per_token": 14e-6,
		"cache_read_input_token_cost": 175e-9,
		"max_tokens": 16384,
		"max_input_tokens": 128e3,
		"max_output_tokens": 16384
	},
	"azure/gpt-5.2-codex": {
		"input_cost_per_token": 175e-8,
		"output_cost_per_token": 14e-6,
		"cache_read_input_token_cost": 175e-9,
		"max_tokens": 128e3,
		"max_input_tokens": 272e3,
		"max_output_tokens": 128e3
	},
	"azure/gpt-5.3-chat": {
		"input_cost_per_token": 175e-8,
		"output_cost_per_token": 14e-6,
		"cache_read_input_token_cost": 175e-9,
		"max_tokens": 16384,
		"max_input_tokens": 128e3,
		"max_output_tokens": 16384
	},
	"azure/gpt-5.3-codex": {
		"input_cost_per_token": 175e-8,
		"output_cost_per_token": 14e-6,
		"cache_read_input_token_cost": 175e-9,
		"max_tokens": 128e3,
		"max_input_tokens": 272e3,
		"max_output_tokens": 128e3
	},
	"azure/gpt-5.2-pro": {
		"input_cost_per_token": 21e-6,
		"output_cost_per_token": 168e-6,
		"max_tokens": 128e3,
		"max_input_tokens": 272e3,
		"max_output_tokens": 128e3
	},
	"azure/gpt-5.2-pro-2025-12-11": {
		"input_cost_per_token": 21e-6,
		"output_cost_per_token": 168e-6,
		"max_tokens": 128e3,
		"max_input_tokens": 272e3,
		"max_output_tokens": 128e3
	},
	"azure/gpt-5.4": {
		"input_cost_per_token": 25e-7,
		"output_cost_per_token": 15e-6,
		"cache_read_input_token_cost": 25e-8,
		"max_tokens": 128e3,
		"max_input_tokens": 105e4,
		"max_output_tokens": 128e3
	},
	"azure/gpt-5.4-2026-03-05": {
		"input_cost_per_token": 25e-7,
		"output_cost_per_token": 15e-6,
		"cache_read_input_token_cost": 25e-8,
		"max_tokens": 128e3,
		"max_input_tokens": 105e4,
		"max_output_tokens": 128e3
	},
	"azure/gpt-5.4-pro": {
		"input_cost_per_token": 3e-5,
		"output_cost_per_token": 18e-5,
		"cache_read_input_token_cost": 3e-6,
		"max_tokens": 128e3,
		"max_input_tokens": 105e4,
		"max_output_tokens": 128e3
	},
	"azure/gpt-5.4-pro-2026-03-05": {
		"input_cost_per_token": 3e-5,
		"output_cost_per_token": 18e-5,
		"cache_read_input_token_cost": 3e-6,
		"max_tokens": 128e3,
		"max_input_tokens": 105e4,
		"max_output_tokens": 128e3
	},
	"gpt-5": {
		"input_cost_per_token": 125e-8,
		"output_cost_per_token": 1e-5,
		"cache_read_input_token_cost": 125e-9,
		"max_tokens": 128e3,
		"max_input_tokens": 272e3,
		"max_output_tokens": 128e3
	},
	"gpt-5.1": {
		"input_cost_per_token": 125e-8,
		"output_cost_per_token": 1e-5,
		"cache_read_input_token_cost": 125e-9,
		"max_tokens": 128e3,
		"max_input_tokens": 272e3,
		"max_output_tokens": 128e3
	},
	"gpt-5.1-2025-11-13": {
		"input_cost_per_token": 125e-8,
		"output_cost_per_token": 1e-5,
		"cache_read_input_token_cost": 125e-9,
		"max_tokens": 128e3,
		"max_input_tokens": 272e3,
		"max_output_tokens": 128e3
	},
	"gpt-5.1-chat-latest": {
		"input_cost_per_token": 125e-8,
		"output_cost_per_token": 1e-5,
		"cache_read_input_token_cost": 125e-9,
		"max_tokens": 16384,
		"max_input_tokens": 128e3,
		"max_output_tokens": 16384
	},
	"gpt-5.2": {
		"input_cost_per_token": 175e-8,
		"output_cost_per_token": 14e-6,
		"cache_read_input_token_cost": 175e-9,
		"max_tokens": 128e3,
		"max_input_tokens": 272e3,
		"max_output_tokens": 128e3
	},
	"gpt-5.2-2025-12-11": {
		"input_cost_per_token": 175e-8,
		"output_cost_per_token": 14e-6,
		"cache_read_input_token_cost": 175e-9,
		"max_tokens": 128e3,
		"max_input_tokens": 272e3,
		"max_output_tokens": 128e3
	},
	"gpt-5.2-chat-latest": {
		"input_cost_per_token": 175e-8,
		"output_cost_per_token": 14e-6,
		"cache_read_input_token_cost": 175e-9,
		"max_tokens": 16384,
		"max_input_tokens": 128e3,
		"max_output_tokens": 16384
	},
	"gpt-5.3-chat-latest": {
		"input_cost_per_token": 175e-8,
		"output_cost_per_token": 14e-6,
		"cache_read_input_token_cost": 175e-9,
		"max_tokens": 16384,
		"max_input_tokens": 128e3,
		"max_output_tokens": 16384
	},
	"gpt-5.2-pro": {
		"input_cost_per_token": 21e-6,
		"output_cost_per_token": 168e-6,
		"max_tokens": 128e3,
		"max_input_tokens": 272e3,
		"max_output_tokens": 128e3
	},
	"gpt-5.2-pro-2025-12-11": {
		"input_cost_per_token": 21e-6,
		"output_cost_per_token": 168e-6,
		"max_tokens": 128e3,
		"max_input_tokens": 272e3,
		"max_output_tokens": 128e3
	},
	"gpt-5.4": {
		"input_cost_per_token": 25e-7,
		"output_cost_per_token": 15e-6,
		"cache_read_input_token_cost": 25e-8,
		"max_tokens": 128e3,
		"max_input_tokens": 105e4,
		"max_output_tokens": 128e3
	},
	"gpt-5.4-2026-03-05": {
		"input_cost_per_token": 25e-7,
		"output_cost_per_token": 15e-6,
		"cache_read_input_token_cost": 25e-8,
		"max_tokens": 128e3,
		"max_input_tokens": 105e4,
		"max_output_tokens": 128e3
	},
	"gpt-5.4-pro": {
		"input_cost_per_token": 3e-5,
		"output_cost_per_token": 18e-5,
		"cache_read_input_token_cost": 3e-6,
		"max_tokens": 128e3,
		"max_input_tokens": 105e4,
		"max_output_tokens": 128e3
	},
	"gpt-5.4-pro-2026-03-05": {
		"input_cost_per_token": 3e-5,
		"output_cost_per_token": 18e-5,
		"cache_read_input_token_cost": 3e-6,
		"max_tokens": 128e3,
		"max_input_tokens": 105e4,
		"max_output_tokens": 128e3
	},
	"gpt-5-pro": {
		"input_cost_per_token": 15e-6,
		"output_cost_per_token": 12e-5,
		"max_tokens": 272e3,
		"max_input_tokens": 128e3,
		"max_output_tokens": 272e3
	},
	"gpt-5-pro-2025-10-06": {
		"input_cost_per_token": 15e-6,
		"output_cost_per_token": 12e-5,
		"max_tokens": 272e3,
		"max_input_tokens": 128e3,
		"max_output_tokens": 272e3
	},
	"gpt-5-2025-08-07": {
		"input_cost_per_token": 125e-8,
		"output_cost_per_token": 1e-5,
		"cache_read_input_token_cost": 125e-9,
		"max_tokens": 128e3,
		"max_input_tokens": 272e3,
		"max_output_tokens": 128e3
	},
	"gpt-5-chat": {
		"input_cost_per_token": 125e-8,
		"output_cost_per_token": 1e-5,
		"cache_read_input_token_cost": 125e-9,
		"max_tokens": 16384,
		"max_input_tokens": 128e3,
		"max_output_tokens": 16384
	},
	"gpt-5-chat-latest": {
		"input_cost_per_token": 125e-8,
		"output_cost_per_token": 1e-5,
		"cache_read_input_token_cost": 125e-9,
		"max_tokens": 16384,
		"max_input_tokens": 128e3,
		"max_output_tokens": 16384
	},
	"gpt-5-codex": {
		"input_cost_per_token": 125e-8,
		"output_cost_per_token": 1e-5,
		"cache_read_input_token_cost": 125e-9,
		"max_tokens": 128e3,
		"max_input_tokens": 272e3,
		"max_output_tokens": 128e3
	},
	"gpt-5.1-codex": {
		"input_cost_per_token": 125e-8,
		"output_cost_per_token": 1e-5,
		"cache_read_input_token_cost": 125e-9,
		"max_tokens": 128e3,
		"max_input_tokens": 272e3,
		"max_output_tokens": 128e3
	},
	"gpt-5.1-codex-max": {
		"input_cost_per_token": 125e-8,
		"output_cost_per_token": 1e-5,
		"cache_read_input_token_cost": 125e-9,
		"max_tokens": 128e3,
		"max_input_tokens": 272e3,
		"max_output_tokens": 128e3
	},
	"gpt-5.1-codex-mini": {
		"input_cost_per_token": 25e-8,
		"output_cost_per_token": 2e-6,
		"cache_read_input_token_cost": 25e-9,
		"max_tokens": 128e3,
		"max_input_tokens": 272e3,
		"max_output_tokens": 128e3
	},
	"gpt-5.2-codex": {
		"input_cost_per_token": 175e-8,
		"output_cost_per_token": 14e-6,
		"cache_read_input_token_cost": 175e-9,
		"max_tokens": 128e3,
		"max_input_tokens": 272e3,
		"max_output_tokens": 128e3
	},
	"gpt-5.3-codex": {
		"input_cost_per_token": 175e-8,
		"output_cost_per_token": 14e-6,
		"cache_read_input_token_cost": 175e-9,
		"max_tokens": 128e3,
		"max_input_tokens": 272e3,
		"max_output_tokens": 128e3
	},
	"gpt-5-mini": {
		"input_cost_per_token": 25e-8,
		"output_cost_per_token": 2e-6,
		"cache_read_input_token_cost": 25e-9,
		"max_tokens": 128e3,
		"max_input_tokens": 272e3,
		"max_output_tokens": 128e3
	},
	"gpt-5-mini-2025-08-07": {
		"input_cost_per_token": 25e-8,
		"output_cost_per_token": 2e-6,
		"cache_read_input_token_cost": 25e-9,
		"max_tokens": 128e3,
		"max_input_tokens": 272e3,
		"max_output_tokens": 128e3
	},
	"gpt-5-nano": {
		"input_cost_per_token": 5e-8,
		"output_cost_per_token": 4e-7,
		"cache_read_input_token_cost": 5e-9,
		"max_tokens": 128e3,
		"max_input_tokens": 272e3,
		"max_output_tokens": 128e3
	},
	"gpt-5-nano-2025-08-07": {
		"input_cost_per_token": 5e-8,
		"output_cost_per_token": 4e-7,
		"cache_read_input_token_cost": 5e-9,
		"max_tokens": 128e3,
		"max_input_tokens": 272e3,
		"max_output_tokens": 128e3
	},
	"openrouter/openai/gpt-5-chat": {
		"input_cost_per_token": 125e-8,
		"output_cost_per_token": 1e-5,
		"cache_read_input_token_cost": 125e-9,
		"max_tokens": 16384,
		"max_input_tokens": 128e3,
		"max_output_tokens": 16384
	},
	"openrouter/openai/gpt-5-codex": {
		"input_cost_per_token": 125e-8,
		"output_cost_per_token": 1e-5,
		"cache_read_input_token_cost": 125e-9,
		"max_tokens": 128e3,
		"max_input_tokens": 272e3,
		"max_output_tokens": 128e3
	},
	"openrouter/openai/gpt-5.2-codex": {
		"input_cost_per_token": 175e-8,
		"output_cost_per_token": 14e-6,
		"cache_read_input_token_cost": 175e-9,
		"max_tokens": 128e3,
		"max_input_tokens": 272e3,
		"max_output_tokens": 128e3
	},
	"openrouter/openai/gpt-5": {
		"input_cost_per_token": 125e-8,
		"output_cost_per_token": 1e-5,
		"cache_read_input_token_cost": 125e-9,
		"max_tokens": 128e3,
		"max_input_tokens": 272e3,
		"max_output_tokens": 128e3
	},
	"openrouter/openai/gpt-5-mini": {
		"input_cost_per_token": 25e-8,
		"output_cost_per_token": 2e-6,
		"cache_read_input_token_cost": 25e-9,
		"max_tokens": 128e3,
		"max_input_tokens": 272e3,
		"max_output_tokens": 128e3
	},
	"openrouter/openai/gpt-5-nano": {
		"input_cost_per_token": 5e-8,
		"output_cost_per_token": 4e-7,
		"cache_read_input_token_cost": 5e-9,
		"max_tokens": 128e3,
		"max_input_tokens": 272e3,
		"max_output_tokens": 128e3
	},
	"openrouter/openai/gpt-5.1-codex-max": {
		"input_cost_per_token": 125e-8,
		"output_cost_per_token": 1e-5,
		"cache_read_input_token_cost": 125e-9,
		"max_tokens": 128e3,
		"max_input_tokens": 4e5,
		"max_output_tokens": 128e3
	},
	"openrouter/openai/gpt-5.2": {
		"input_cost_per_token": 175e-8,
		"output_cost_per_token": 14e-6,
		"cache_read_input_token_cost": 175e-9,
		"max_tokens": 128e3,
		"max_input_tokens": 272e3,
		"max_output_tokens": 128e3
	},
	"openrouter/openai/gpt-5.2-chat": {
		"input_cost_per_token": 175e-8,
		"output_cost_per_token": 14e-6,
		"cache_read_input_token_cost": 175e-9,
		"max_tokens": 16384,
		"max_input_tokens": 128e3,
		"max_output_tokens": 16384
	},
	"openrouter/openai/gpt-5.2-pro": {
		"input_cost_per_token": 21e-6,
		"output_cost_per_token": 168e-6,
		"max_tokens": 128e3,
		"max_input_tokens": 272e3,
		"max_output_tokens": 128e3
	},
	"gpt-5-search-api": {
		"input_cost_per_token": 125e-8,
		"output_cost_per_token": 1e-5,
		"cache_read_input_token_cost": 125e-9,
		"max_tokens": 128e3,
		"max_input_tokens": 272e3,
		"max_output_tokens": 128e3
	},
	"gpt-5-search-api-2025-10-14": {
		"input_cost_per_token": 125e-8,
		"output_cost_per_token": 1e-5,
		"cache_read_input_token_cost": 125e-9,
		"max_tokens": 128e3,
		"max_input_tokens": 272e3,
		"max_output_tokens": 128e3
	}
};
var CodexPricingSource = class {
	fetcher;
	constructor(options = {}) {
		this.fetcher = new LiteLLMPricingFetcher({
			offline: options.offline ?? false,
			offlineLoader: options.offlineLoader ?? (async () => PREFETCHED_CODEX_PRICING),
			logger,
			providerPrefixes: CODEX_PROVIDER_PREFIXES
		});
	}
	[Symbol.dispose]() {
		this.fetcher[Symbol.dispose]();
	}
	async getPricing(model) {
		if (isOpenRouterFreeModel(model)) return FREE_MODEL_PRICING;
		const directLookup = await this.fetcher.getModelPricing(model);
		if (isFailure(directLookup)) throw directLookup.error;
		let pricing = directLookup.value;
		const alias = CODEX_MODEL_ALIASES_MAP.get(model);
		if (alias != null && (pricing == null || !hasNonZeroTokenPricing(pricing))) {
			const aliasLookup = await this.fetcher.getModelPricing(alias);
			if (isFailure(aliasLookup)) throw aliasLookup.error;
			if (aliasLookup.value != null && hasNonZeroTokenPricing(aliasLookup.value)) pricing = aliasLookup.value;
		}
		if (pricing == null) {
			logger.warn(`Pricing not found for model ${model}; defaulting to zero-cost pricing.`);
			return FREE_MODEL_PRICING;
		}
		return {
			inputCostPerMToken: toPerMillion(pricing.input_cost_per_token),
			cachedInputCostPerMToken: toPerMillion(pricing.cache_read_input_token_cost, pricing.input_cost_per_token),
			outputCostPerMToken: toPerMillion(pricing.output_cost_per_token)
		};
	}
};
var import_picocolors$2 = /* @__PURE__ */ __toESM(require_picocolors(), 1);
const TABLE_COLUMN_COUNT$2 = 8;
const dailyCommand = define({
	name: "daily",
	description: "Show Codex token usage grouped by day",
	args: sharedArgs,
	async run(ctx) {
		const jsonOutput = Boolean(ctx.values.json);
		if (jsonOutput) logger.level = 0;
		let since;
		let until;
		try {
			since = normalizeFilterDate(ctx.values.since);
			until = normalizeFilterDate(ctx.values.until);
		} catch (error) {
			logger.error(String(error));
			process$1.exit(1);
		}
		const { events, missingDirectories } = await loadTokenUsageEvents();
		for (const missing of missingDirectories) logger.warn(`Codex session directory not found: ${missing}`);
		if (events.length === 0) {
			log(jsonOutput ? JSON.stringify({
				daily: [],
				totals: null
			}) : "No Codex usage data found.");
			return;
		}
		const pricingSource = new CodexPricingSource({ offline: ctx.values.offline });
		try {
			const rows = await buildDailyReport(events, {
				pricingSource,
				timezone: ctx.values.timezone,
				locale: ctx.values.locale,
				since,
				until
			});
			if (rows.length === 0) {
				log(jsonOutput ? JSON.stringify({
					daily: [],
					totals: null
				}) : "No Codex usage data found for provided filters.");
				return;
			}
			const totals = rows.reduce((acc, row) => {
				acc.inputTokens += row.inputTokens;
				acc.cachedInputTokens += row.cachedInputTokens;
				acc.outputTokens += row.outputTokens;
				acc.reasoningOutputTokens += row.reasoningOutputTokens;
				acc.totalTokens += row.totalTokens;
				acc.costUSD += row.costUSD;
				return acc;
			}, {
				inputTokens: 0,
				cachedInputTokens: 0,
				outputTokens: 0,
				reasoningOutputTokens: 0,
				totalTokens: 0,
				costUSD: 0
			});
			if (jsonOutput) {
				log(JSON.stringify({
					daily: rows,
					totals
				}, null, 2));
				return;
			}
			logger.box(`Codex Token Usage Report - Daily (Timezone: ${ctx.values.timezone ?? DEFAULT_TIMEZONE})`);
			const table = new ResponsiveTable({
				head: [
					"Date",
					"Models",
					"Input",
					"Output",
					"Reasoning",
					"Cache Read",
					"Total Tokens",
					"Cost (USD)"
				],
				colAligns: [
					"left",
					"left",
					"right",
					"right",
					"right",
					"right",
					"right",
					"right"
				],
				compactHead: [
					"Date",
					"Models",
					"Input",
					"Output",
					"Cost (USD)"
				],
				compactColAligns: [
					"left",
					"left",
					"right",
					"right",
					"right"
				],
				compactThreshold: 100,
				forceCompact: ctx.values.compact,
				style: { head: ["cyan"] },
				dateFormatter: (dateStr) => formatDateCompact(dateStr)
			});
			const totalsForDisplay = {
				inputTokens: 0,
				outputTokens: 0,
				reasoningTokens: 0,
				cacheReadTokens: 0,
				totalTokens: 0,
				costUSD: 0
			};
			for (const row of rows) {
				const split = splitUsageTokens(row);
				totalsForDisplay.inputTokens += split.inputTokens;
				totalsForDisplay.outputTokens += split.outputTokens;
				totalsForDisplay.reasoningTokens += split.reasoningTokens;
				totalsForDisplay.cacheReadTokens += split.cacheReadTokens;
				totalsForDisplay.totalTokens += row.totalTokens;
				totalsForDisplay.costUSD += row.costUSD;
				table.push([
					row.date,
					formatModelsDisplayMultiline(formatModelsList(row.models)),
					formatNumber(split.inputTokens),
					formatNumber(split.outputTokens),
					formatNumber(split.reasoningTokens),
					formatNumber(split.cacheReadTokens),
					formatNumber(row.totalTokens),
					formatCurrency(row.costUSD)
				]);
			}
			addEmptySeparatorRow(table, TABLE_COLUMN_COUNT$2);
			table.push([
				import_picocolors$2.default.yellow("Total"),
				"",
				import_picocolors$2.default.yellow(formatNumber(totalsForDisplay.inputTokens)),
				import_picocolors$2.default.yellow(formatNumber(totalsForDisplay.outputTokens)),
				import_picocolors$2.default.yellow(formatNumber(totalsForDisplay.reasoningTokens)),
				import_picocolors$2.default.yellow(formatNumber(totalsForDisplay.cacheReadTokens)),
				import_picocolors$2.default.yellow(formatNumber(totalsForDisplay.totalTokens)),
				import_picocolors$2.default.yellow(formatCurrency(totalsForDisplay.costUSD))
			]);
			log(table.toString());
			if (table.isCompactMode()) {
				logger.info("\nRunning in Compact Mode");
				logger.info("Expand terminal width to see cache metrics and total tokens");
			}
		} finally {
			pricingSource[Symbol.dispose]();
		}
	}
});
function createSummary$1(month, initialTimestamp) {
	return {
		month,
		firstTimestamp: initialTimestamp,
		inputTokens: 0,
		cachedInputTokens: 0,
		outputTokens: 0,
		reasoningOutputTokens: 0,
		totalTokens: 0,
		costUSD: 0,
		models: /* @__PURE__ */ new Map()
	};
}
async function buildMonthlyReport(events, options) {
	const timezone = options.timezone;
	const locale = options.locale;
	const since = options.since;
	const until = options.until;
	const pricingSource = options.pricingSource;
	const summaries = /* @__PURE__ */ new Map();
	for (const event of events) {
		const modelName = event.model?.trim();
		if (modelName == null || modelName === "") continue;
		if (!isWithinRange(toDateKey(event.timestamp, timezone), since, until)) continue;
		const monthKey = toMonthKey(event.timestamp, timezone);
		const summary = summaries.get(monthKey) ?? createSummary$1(monthKey, event.timestamp);
		if (!summaries.has(monthKey)) summaries.set(monthKey, summary);
		addUsage(summary, event);
		const modelUsage = summary.models.get(modelName) ?? {
			...createEmptyUsage(),
			isFallback: false
		};
		if (!summary.models.has(modelName)) summary.models.set(modelName, modelUsage);
		addUsage(modelUsage, event);
		if (event.isFallbackModel === true) modelUsage.isFallback = true;
	}
	const uniqueModels = /* @__PURE__ */ new Set();
	for (const summary of summaries.values()) for (const modelName of summary.models.keys()) uniqueModels.add(modelName);
	const modelPricing = /* @__PURE__ */ new Map();
	for (const modelName of uniqueModels) modelPricing.set(modelName, await pricingSource.getPricing(modelName));
	const rows = [];
	const sortedSummaries = Array.from(summaries.values()).sort((a$2, b$2) => a$2.month.localeCompare(b$2.month));
	for (const summary of sortedSummaries) {
		let cost = 0;
		for (const [modelName, usage] of summary.models) {
			const pricing = modelPricing.get(modelName);
			if (pricing == null) continue;
			cost += calculateCostUSD(usage, pricing);
		}
		summary.costUSD = cost;
		const rowModels = {};
		for (const [modelName, usage] of summary.models) rowModels[modelName] = { ...usage };
		rows.push({
			month: formatDisplayMonth(summary.month, locale, timezone),
			inputTokens: summary.inputTokens,
			cachedInputTokens: summary.cachedInputTokens,
			outputTokens: summary.outputTokens,
			reasoningOutputTokens: summary.reasoningOutputTokens,
			totalTokens: summary.totalTokens,
			costUSD: cost,
			models: rowModels
		});
	}
	return rows;
}
var import_picocolors$1 = /* @__PURE__ */ __toESM(require_picocolors(), 1);
const TABLE_COLUMN_COUNT$1 = 8;
const monthlyCommand = define({
	name: "monthly",
	description: "Show Codex token usage grouped by month",
	args: sharedArgs,
	async run(ctx) {
		const jsonOutput = Boolean(ctx.values.json);
		if (jsonOutput) logger.level = 0;
		let since;
		let until;
		try {
			since = normalizeFilterDate(ctx.values.since);
			until = normalizeFilterDate(ctx.values.until);
		} catch (error) {
			logger.error(String(error));
			process$1.exit(1);
		}
		const { events, missingDirectories } = await loadTokenUsageEvents();
		for (const missing of missingDirectories) logger.warn(`Codex session directory not found: ${missing}`);
		if (events.length === 0) {
			log(jsonOutput ? JSON.stringify({
				monthly: [],
				totals: null
			}) : "No Codex usage data found.");
			return;
		}
		const pricingSource = new CodexPricingSource({ offline: ctx.values.offline });
		try {
			const rows = await buildMonthlyReport(events, {
				pricingSource,
				timezone: ctx.values.timezone,
				locale: ctx.values.locale,
				since,
				until
			});
			if (rows.length === 0) {
				log(jsonOutput ? JSON.stringify({
					monthly: [],
					totals: null
				}) : "No Codex usage data found for provided filters.");
				return;
			}
			const totals = rows.reduce((acc, row) => {
				acc.inputTokens += row.inputTokens;
				acc.cachedInputTokens += row.cachedInputTokens;
				acc.outputTokens += row.outputTokens;
				acc.reasoningOutputTokens += row.reasoningOutputTokens;
				acc.totalTokens += row.totalTokens;
				acc.costUSD += row.costUSD;
				return acc;
			}, {
				inputTokens: 0,
				cachedInputTokens: 0,
				outputTokens: 0,
				reasoningOutputTokens: 0,
				totalTokens: 0,
				costUSD: 0
			});
			if (jsonOutput) {
				log(JSON.stringify({
					monthly: rows,
					totals
				}, null, 2));
				return;
			}
			logger.box(`Codex Token Usage Report - Monthly (Timezone: ${ctx.values.timezone ?? DEFAULT_TIMEZONE})`);
			const table = new ResponsiveTable({
				head: [
					"Month",
					"Models",
					"Input",
					"Output",
					"Reasoning",
					"Cache Read",
					"Total Tokens",
					"Cost (USD)"
				],
				colAligns: [
					"left",
					"left",
					"right",
					"right",
					"right",
					"right",
					"right",
					"right"
				],
				compactHead: [
					"Month",
					"Models",
					"Input",
					"Output",
					"Cost (USD)"
				],
				compactColAligns: [
					"left",
					"left",
					"right",
					"right",
					"right"
				],
				compactThreshold: 100,
				forceCompact: ctx.values.compact,
				style: { head: ["cyan"] },
				dateFormatter: (dateStr) => formatDateCompact(dateStr)
			});
			const totalsForDisplay = {
				inputTokens: 0,
				outputTokens: 0,
				reasoningTokens: 0,
				cacheReadTokens: 0,
				totalTokens: 0,
				costUSD: 0
			};
			for (const row of rows) {
				const split = splitUsageTokens(row);
				totalsForDisplay.inputTokens += split.inputTokens;
				totalsForDisplay.outputTokens += split.outputTokens;
				totalsForDisplay.reasoningTokens += split.reasoningTokens;
				totalsForDisplay.cacheReadTokens += split.cacheReadTokens;
				totalsForDisplay.totalTokens += row.totalTokens;
				totalsForDisplay.costUSD += row.costUSD;
				table.push([
					row.month,
					formatModelsDisplayMultiline(formatModelsList(row.models)),
					formatNumber(split.inputTokens),
					formatNumber(split.outputTokens),
					formatNumber(split.reasoningTokens),
					formatNumber(split.cacheReadTokens),
					formatNumber(row.totalTokens),
					formatCurrency(row.costUSD)
				]);
			}
			addEmptySeparatorRow(table, TABLE_COLUMN_COUNT$1);
			table.push([
				import_picocolors$1.default.yellow("Total"),
				"",
				import_picocolors$1.default.yellow(formatNumber(totalsForDisplay.inputTokens)),
				import_picocolors$1.default.yellow(formatNumber(totalsForDisplay.outputTokens)),
				import_picocolors$1.default.yellow(formatNumber(totalsForDisplay.reasoningTokens)),
				import_picocolors$1.default.yellow(formatNumber(totalsForDisplay.cacheReadTokens)),
				import_picocolors$1.default.yellow(formatNumber(totalsForDisplay.totalTokens)),
				import_picocolors$1.default.yellow(formatCurrency(totalsForDisplay.costUSD))
			]);
			log(table.toString());
			if (table.isCompactMode()) {
				logger.info("\nRunning in Compact Mode");
				logger.info("Expand terminal width to see cache metrics and total tokens");
			}
		} finally {
			pricingSource[Symbol.dispose]();
		}
	}
});
function createSummary(sessionId, initialTimestamp) {
	return {
		sessionId,
		firstTimestamp: initialTimestamp,
		lastTimestamp: initialTimestamp,
		inputTokens: 0,
		cachedInputTokens: 0,
		outputTokens: 0,
		reasoningOutputTokens: 0,
		totalTokens: 0,
		costUSD: 0,
		models: /* @__PURE__ */ new Map()
	};
}
async function buildSessionReport(events, options) {
	const timezone = options.timezone;
	const since = options.since;
	const until = options.until;
	const pricingSource = options.pricingSource;
	const summaries = /* @__PURE__ */ new Map();
	for (const event of events) {
		const rawSessionId = event.sessionId;
		if (rawSessionId == null) continue;
		const sessionId = rawSessionId.trim();
		if (sessionId === "") continue;
		const rawModelName = event.model;
		if (rawModelName == null) continue;
		const modelName = rawModelName.trim();
		if (modelName === "") continue;
		if (!isWithinRange(toDateKey(event.timestamp, timezone), since, until)) continue;
		const summary = summaries.get(sessionId) ?? createSummary(sessionId, event.timestamp);
		if (!summaries.has(sessionId)) summaries.set(sessionId, summary);
		addUsage(summary, event);
		if (event.timestamp > summary.lastTimestamp) summary.lastTimestamp = event.timestamp;
		const modelUsage = summary.models.get(modelName) ?? {
			...createEmptyUsage(),
			isFallback: false
		};
		if (!summary.models.has(modelName)) summary.models.set(modelName, modelUsage);
		addUsage(modelUsage, event);
		if (event.isFallbackModel === true) modelUsage.isFallback = true;
	}
	if (summaries.size === 0) return [];
	const uniqueModels = /* @__PURE__ */ new Set();
	for (const summary of summaries.values()) for (const modelName of summary.models.keys()) uniqueModels.add(modelName);
	const modelPricing = /* @__PURE__ */ new Map();
	for (const modelName of uniqueModels) modelPricing.set(modelName, await pricingSource.getPricing(modelName));
	const sortedSummaries = Array.from(summaries.values()).sort((a$2, b$2) => a$2.lastTimestamp.localeCompare(b$2.lastTimestamp));
	const rows = [];
	for (const summary of sortedSummaries) {
		let cost = 0;
		for (const [modelName, usage] of summary.models) {
			const pricing = modelPricing.get(modelName);
			if (pricing == null) continue;
			cost += calculateCostUSD(usage, pricing);
		}
		summary.costUSD = cost;
		const rowModels = {};
		for (const [modelName, usage] of summary.models) rowModels[modelName] = { ...usage };
		const separatorIndex = summary.sessionId.lastIndexOf("/");
		const directory = separatorIndex >= 0 ? summary.sessionId.slice(0, separatorIndex) : "";
		const sessionFile = separatorIndex >= 0 ? summary.sessionId.slice(separatorIndex + 1) : summary.sessionId;
		rows.push({
			sessionId: summary.sessionId,
			lastActivity: summary.lastTimestamp,
			sessionFile,
			directory,
			inputTokens: summary.inputTokens,
			cachedInputTokens: summary.cachedInputTokens,
			outputTokens: summary.outputTokens,
			reasoningOutputTokens: summary.reasoningOutputTokens,
			totalTokens: summary.totalTokens,
			costUSD: cost,
			models: rowModels
		});
	}
	return rows;
}
var import_picocolors = /* @__PURE__ */ __toESM(require_picocolors(), 1);
const TABLE_COLUMN_COUNT = 11;
const sessionCommand = define({
	name: "session",
	description: "Show Codex token usage grouped by session",
	args: sharedArgs,
	async run(ctx) {
		const jsonOutput = Boolean(ctx.values.json);
		if (jsonOutput) logger.level = 0;
		let since;
		let until;
		try {
			since = normalizeFilterDate(ctx.values.since);
			until = normalizeFilterDate(ctx.values.until);
		} catch (error) {
			logger.error(String(error));
			process$1.exit(1);
		}
		const { events, missingDirectories } = await loadTokenUsageEvents();
		for (const missing of missingDirectories) logger.warn(`Codex session directory not found: ${missing}`);
		if (events.length === 0) {
			log(jsonOutput ? JSON.stringify({
				sessions: [],
				totals: null
			}) : "No Codex usage data found.");
			return;
		}
		const pricingSource = new CodexPricingSource({ offline: ctx.values.offline });
		try {
			const rows = await buildSessionReport(events, {
				pricingSource,
				timezone: ctx.values.timezone,
				locale: ctx.values.locale,
				since,
				until
			});
			if (rows.length === 0) {
				log(jsonOutput ? JSON.stringify({
					sessions: [],
					totals: null
				}) : "No Codex usage data found for provided filters.");
				return;
			}
			const totals = rows.reduce((acc, row) => {
				acc.inputTokens += row.inputTokens;
				acc.cachedInputTokens += row.cachedInputTokens;
				acc.outputTokens += row.outputTokens;
				acc.reasoningOutputTokens += row.reasoningOutputTokens;
				acc.totalTokens += row.totalTokens;
				acc.costUSD += row.costUSD;
				return acc;
			}, {
				inputTokens: 0,
				cachedInputTokens: 0,
				outputTokens: 0,
				reasoningOutputTokens: 0,
				totalTokens: 0,
				costUSD: 0
			});
			if (jsonOutput) {
				log(JSON.stringify({
					sessions: rows,
					totals
				}, null, 2));
				return;
			}
			logger.box(`Codex Token Usage Report - Sessions (Timezone: ${ctx.values.timezone ?? DEFAULT_TIMEZONE})`);
			const table = new ResponsiveTable({
				head: [
					"Date",
					"Directory",
					"Session",
					"Models",
					"Input",
					"Output",
					"Reasoning",
					"Cache Read",
					"Total Tokens",
					"Cost (USD)",
					"Last Activity"
				],
				colAligns: [
					"left",
					"left",
					"left",
					"left",
					"right",
					"right",
					"right",
					"right",
					"right",
					"right",
					"left"
				],
				compactHead: [
					"Date",
					"Directory",
					"Session",
					"Input",
					"Output",
					"Cost (USD)"
				],
				compactColAligns: [
					"left",
					"left",
					"left",
					"right",
					"right",
					"right"
				],
				compactThreshold: 100,
				forceCompact: ctx.values.compact,
				style: { head: ["cyan"] },
				dateFormatter: (dateStr) => formatDateCompact(dateStr)
			});
			const totalsForDisplay = {
				inputTokens: 0,
				outputTokens: 0,
				reasoningTokens: 0,
				cacheReadTokens: 0,
				totalTokens: 0,
				costUSD: 0
			};
			for (const row of rows) {
				const split = splitUsageTokens(row);
				totalsForDisplay.inputTokens += split.inputTokens;
				totalsForDisplay.outputTokens += split.outputTokens;
				totalsForDisplay.reasoningTokens += split.reasoningTokens;
				totalsForDisplay.cacheReadTokens += split.cacheReadTokens;
				totalsForDisplay.totalTokens += row.totalTokens;
				totalsForDisplay.costUSD += row.costUSD;
				const displayDate = formatDisplayDate(toDateKey(row.lastActivity, ctx.values.timezone), ctx.values.locale, ctx.values.timezone);
				const directoryDisplay = row.directory === "" ? "-" : row.directory;
				const sessionFile = row.sessionFile;
				const shortSession = sessionFile.length > 8 ? `…${sessionFile.slice(-8)}` : sessionFile;
				table.push([
					displayDate,
					directoryDisplay,
					shortSession,
					formatModelsDisplayMultiline(formatModelsList(row.models)),
					formatNumber(split.inputTokens),
					formatNumber(split.outputTokens),
					formatNumber(split.reasoningTokens),
					formatNumber(split.cacheReadTokens),
					formatNumber(row.totalTokens),
					formatCurrency(row.costUSD),
					formatDisplayDateTime(row.lastActivity, ctx.values.locale, ctx.values.timezone)
				]);
			}
			addEmptySeparatorRow(table, TABLE_COLUMN_COUNT);
			table.push([
				"",
				"",
				import_picocolors.default.yellow("Total"),
				"",
				import_picocolors.default.yellow(formatNumber(totalsForDisplay.inputTokens)),
				import_picocolors.default.yellow(formatNumber(totalsForDisplay.outputTokens)),
				import_picocolors.default.yellow(formatNumber(totalsForDisplay.reasoningTokens)),
				import_picocolors.default.yellow(formatNumber(totalsForDisplay.cacheReadTokens)),
				import_picocolors.default.yellow(formatNumber(totalsForDisplay.totalTokens)),
				import_picocolors.default.yellow(formatCurrency(totalsForDisplay.costUSD)),
				""
			]);
			log(table.toString());
			if (table.isCompactMode()) {
				logger.info("\nRunning in Compact Mode");
				logger.info("Expand terminal width to see directories, cache metrics, total tokens, and last activity");
			}
		} finally {
			pricingSource[Symbol.dispose]();
		}
	}
});
const subCommands = new Map([
	["daily", dailyCommand],
	["monthly", monthlyCommand],
	["session", sessionCommand]
]);
const mainCommand = dailyCommand;
async function run() {
	let args = process$1.argv.slice(2);
	if (args[0] === "ccusage-codex") args = args.slice(1);
	await cli(args, mainCommand, {
		name,
		version,
		description,
		subCommands,
		renderHeader: null
	});
}
await run();
export {};

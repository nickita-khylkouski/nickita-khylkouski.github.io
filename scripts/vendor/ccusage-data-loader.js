import { A as object, B as getTotalTokens, C as boolean, F as safeParse, I as string, M as parse$2, N as picklist, S as array, _ as requestIdSchema, a as createDailyDate, b as versionSchema, c as createSessionId, f as isoTimestampSchema, g as projectPathSchema, h as monthlyDateSchema, i as createBucket, j as optional, k as number, l as createWeeklyDate, m as modelNameSchema, o as createMonthlyDate, p as messageIdSchema, r as activityDateSchema, s as createProjectPath, u as dailyDateSchema, v as sessionIdSchema, x as weeklyDateSchema, z as union } from "./_types-DY3gqCWm.js";
import { n as logger } from "./logger-TGVysPie.js";
import { createRequire } from "node:module";
import * as nativeFs from "node:fs";
import b, { createReadStream } from "node:fs";
import a, { readFile, stat } from "node:fs/promises";
import path, { basename, dirname, normalize, posix, relative, resolve, sep } from "node:path";
import process$1 from "node:process";
import { createInterface } from "node:readline";
import F, { homedir } from "node:os";
import { fileURLToPath } from "node:url";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJSMin = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n$1 = keys.length, key; i < n$1; i++) {
		key = keys[i];
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
function toArray(array$1) {
	array$1 = array$1 ?? [];
	return Array.isArray(array$1) ? array$1 : [array$1];
}
const isFailure = (result) => "Failure" === result.type;
const isPromise = (value) => "object" == typeof value && null !== value && "then" in value && "function" == typeof value.then && "catch" in value && "function" == typeof value.catch;
const andThen = (fn) => (result) => {
	const apply = (r) => {
		if (isFailure(r)) return r;
		return fn(r.value);
	};
	return isPromise(result) ? result.then(apply) : apply(result);
};
const andThrough = (fn) => (result) => {
	const apply = (r) => {
		if (isFailure(r)) return r;
		const next = fn(r.value);
		if (isPromise(next)) return next.then((n$1) => {
			if (isFailure(n$1)) return n$1;
			return r;
		});
		if (isFailure(next)) return next;
		return r;
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
	const apply = (r) => {
		if (isSuccess(r)) fn(r.value);
		return r;
	};
	return isPromise(result) ? result.then(apply) : apply(result);
};
const inspectError = (fn) => (result) => {
	const apply = (r) => {
		if (isFailure(r)) fn(r.error);
		return r;
	};
	return isPromise(result) ? result.then(apply) : apply(result);
};
const isResult = (result) => "object" == typeof result && null !== result && "type" in result && ("Success" === result.type && "value" in result || "Failure" === result.type && "error" in result);
const map$1 = (fn) => (result) => {
	const apply = (r) => {
		if (isFailure(r)) return r;
		return succeed(fn(r.value));
	};
	if (isPromise(result)) return result.then(apply);
	return apply(result);
};
const orElse = (fn) => (result) => {
	const apply = (r) => {
		if (isSuccess(r)) return r;
		return fn(r.error);
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
const unwrap = (...args) => {
	const firstArgument = args[0];
	if (isResult(firstArgument) || isPromise(firstArgument)) {
		const result = firstArgument;
		const hasDefault$1 = 2 === args.length;
		const defaultValue$1 = hasDefault$1 ? args[1] : void 0;
		const apply = (r) => {
			if (isFailure(r)) {
				if (hasDefault$1) return defaultValue$1;
				throw r.error;
			}
			return r.value;
		};
		return isPromise(result) ? result.then(apply) : apply(result);
	}
	const hasDefault = 1 === args.length;
	const defaultValue = hasDefault ? args[0] : void 0;
	return (result) => {
		const apply = (r) => {
			if (isFailure(r)) {
				if (hasDefault) return defaultValue;
				throw r.error;
			}
			return r.value;
		};
		return isPromise(result) ? result.then(apply) : apply(result);
	};
};
function groupBy(arr, getKeyFromItem) {
	const result = {};
	for (let i = 0; i < arr.length; i++) {
		const item = arr[i];
		const key = getKeyFromItem(item);
		if (!Object.hasOwn(result, key)) result[key] = [];
		result[key].push(item);
	}
	return result;
}
function uniq(arr) {
	return Array.from(new Set(arr));
}
var d = Object.defineProperty;
var n = (s, t) => d(s, "name", {
	value: t,
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
		n(this, "FsFixture");
	}
	path;
	constructor(t) {
		this.path = t;
	}
	getPath(...t) {
		return path.join(this.path, ...t);
	}
	exists(t = "") {
		return a.access(this.getPath(t)).then(() => !0, () => !1);
	}
	rm(t = "") {
		return a.rm(this.getPath(t), {
			recursive: !0,
			force: !0
		});
	}
	cp(t, r, i) {
		return r ? r.endsWith(path.sep) && (r += path.basename(t)) : r = path.basename(t), a.cp(t, this.getPath(r), i);
	}
	mkdir(t) {
		return a.mkdir(this.getPath(t), { recursive: !0 });
	}
	writeFile(t, r) {
		return a.writeFile(this.getPath(t), r);
	}
	writeJson(t, r) {
		return this.writeFile(t, JSON.stringify(r, null, 2));
	}
	readFile(t, r) {
		return a.readFile(this.getPath(t), r);
	}
	async [Symbol.asyncDispose]() {
		await this.rm();
	}
};
const v = b.realpathSync(F.tmpdir()), D = `fs-fixture-${Date.now()}-${process.pid}`;
let m = 0;
const j = n(() => (m += 1, m), "getId");
var u = class {
	static {
		n(this, "Path");
	}
	path;
	constructor(t) {
		this.path = t;
	}
};
var f$1 = class extends u {
	static {
		n(this, "Directory");
	}
};
var y = class extends u {
	static {
		n(this, "File");
	}
	content;
	constructor(t, r) {
		super(t), this.content = r;
	}
};
var l = class {
	static {
		n(this, "Symlink");
	}
	target;
	type;
	path;
	constructor(t, r) {
		this.target = t, this.type = r;
	}
};
const w = n((s, t, r) => {
	const i = [];
	for (const p$1 in s) {
		if (!Object.hasOwn(s, p$1)) continue;
		const e = path.join(t, p$1);
		let o = s[p$1];
		if (typeof o == "function") {
			const g = Object.assign(Object.create(r), { filePath: e }), h = o(g);
			if (h instanceof l) {
				h.path = e, i.push(h);
				continue;
			} else o = h;
		}
		typeof o == "string" ? i.push(new y(e, o)) : i.push(new f$1(e), ...w(o, e, r));
	}
	return i;
}, "flattenFileTree");
n(async (s, t) => {
	const r = t?.tempDir ? path.resolve(t.tempDir) : v, i = path.join(r, `${D}-${j()}/`);
	if (await a.mkdir(i, { recursive: !0 }), s) {
		if (typeof s == "string") await a.cp(s, i, {
			recursive: !0,
			filter: t?.templateFilter
		});
		else if (typeof s == "object") {
			const p$1 = {
				fixturePath: i,
				getPath: n((...e) => path.join(i, ...e), "getPath"),
				symlink: n((e, o) => new l(e, o), "symlink")
			};
			await Promise.all(w(s, i, p$1).map(async (e) => {
				e instanceof f$1 ? await a.mkdir(e.path, { recursive: !0 }) : e instanceof l ? (await a.mkdir(path.dirname(e.path), { recursive: !0 }), await a.symlink(e.target, e.path, e.type)) : e instanceof y && (await a.mkdir(path.dirname(e.path), { recursive: !0 }), await a.writeFile(e.path, e.content));
			}));
		}
	}
	return new P(i);
}, "createFixture");
async function isType(fsStatType, statsMethodName, filePath) {
	if (typeof filePath !== "string") throw new TypeError(`Expected a string, got ${typeof filePath}`);
	try {
		return (await a[fsStatType](filePath))[statsMethodName]();
	} catch (error) {
		if (error.code === "ENOENT") return false;
		throw error;
	}
}
function isTypeSync(fsStatType, statsMethodName, filePath) {
	if (typeof filePath !== "string") throw new TypeError(`Expected a string, got ${typeof filePath}`);
	try {
		return b[fsStatType](filePath)[statsMethodName]();
	} catch (error) {
		if (error.code === "ENOENT") return false;
		throw error;
	}
}
isType.bind(void 0, "stat", "isFile");
isType.bind(void 0, "stat", "isDirectory");
isType.bind(void 0, "lstat", "isSymbolicLink");
isTypeSync.bind(void 0, "statSync", "isFile");
const isDirectorySync = isTypeSync.bind(void 0, "statSync", "isDirectory");
isTypeSync.bind(void 0, "lstatSync", "isSymbolicLink");
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
	const { queue, fs, options: { suppressErrors } } = state;
	queue.enqueue();
	fs.realpath(path$1, (error, resolvedPath) => {
		if (error) return queue.dequeue(suppressErrors ? null : error, state);
		fs.stat(resolvedPath, (error$1, stat$1) => {
			if (error$1) return queue.dequeue(suppressErrors ? null : error$1, state);
			if (stat$1.isDirectory() && isRecursive(path$1, resolvedPath, state)) return queue.dequeue(null, state);
			callback$1(stat$1, resolvedPath);
			queue.dequeue(null, state);
		});
	});
};
const resolveSymlinks = function(path$1, state, callback$1) {
	const { queue, fs, options: { suppressErrors } } = state;
	queue.enqueue();
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
function build$8(isSynchronous) {
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
		this.walkDirectory = build$8(this.isSynchronous);
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
		for (let i = 0; i < entries.length; ++i) {
			const entry = entries[i];
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
var require_utils$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
	const { REGEX_BACKSLASH, REGEX_REMOVE_BACKSLASH, REGEX_SPECIAL_CHARS, REGEX_SPECIAL_CHARS_GLOBAL } = require_constants();
	exports.isObject = (val) => val !== null && typeof val === "object" && !Array.isArray(val);
	exports.hasRegexChars = (str) => REGEX_SPECIAL_CHARS.test(str);
	exports.isRegexChar = (str) => str.length === 1 && exports.hasRegexChars(str);
	exports.escapeRegex = (str) => str.replace(REGEX_SPECIAL_CHARS_GLOBAL, "\\$1");
	exports.toPosixSlashes = (str) => str.replace(REGEX_BACKSLASH, "/");
	exports.isWindows = () => {
		if (typeof navigator !== "undefined" && navigator.platform) {
			const platform = navigator.platform.toLowerCase();
			return platform === "win32" || platform === "windows";
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
	const utils$5 = require_utils$1();
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
			if (glob$1) glob$1 = utils$5.removeBackslashes(glob$1);
			if (base && backslashes === true) base = utils$5.removeBackslashes(base);
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
				const n$1 = prevIndex ? prevIndex + 1 : start;
				const i = slashes[idx];
				const value = input.slice(n$1, i);
				if (opts.tokens) {
					if (idx === 0 && start !== 0) {
						tokens[idx].isPrefix = true;
						tokens[idx].value = prefix;
					} else tokens[idx].value = value;
					depth(tokens[idx]);
					state.maxDepth += tokens[idx].depth;
				}
				if (idx !== 0 || value !== "") parts.push(value);
				prevIndex = i;
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
	const utils$4 = require_utils$1();
	const { MAX_LENGTH, POSIX_REGEX_SOURCE, REGEX_NON_SPECIAL_CHARS, REGEX_SPECIAL_CHARS_BACKREF, REPLACEMENTS } = constants$1;
	const expandRange = (args, options) => {
		if (typeof options.expandRange === "function") return options.expandRange(...args, options);
		args.sort();
		const value = `[${args.join("-")}]`;
		try {
			new RegExp(value);
		} catch (ex) {
			return args.map((v$1) => utils$4.escapeRegex(v$1)).join("..");
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
		input = utils$4.removePrefix(input, state);
		len = input.length;
		const extglobs = [];
		const braces = [];
		const stack = [];
		let prev = bos;
		let value;
		const eos = () => state.index === len - 1;
		const peek = state.peek = (n$1 = 1) => input[state.index + n$1];
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
			state.output = utils$4.wrapOutput(output, state, options);
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
				value = utils$4.escapeRegex(value);
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
				if (opts.literalBrackets === false || utils$4.hasRegexChars(prevValue)) continue;
				const escaped = utils$4.escapeRegex(prev.value);
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
					for (let i = arr.length - 1; i >= 0; i--) {
						tokens.pop();
						if (arr[i].type === "brace") break;
						if (arr[i].type !== "dots") range.unshift(arr[i].value);
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
					for (const t of toks) state.output += t.output || t.value;
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
			state.output = utils$4.escapeLast(state.output, "[");
			decrement("brackets");
		}
		while (state.parens > 0) {
			if (opts.strictBrackets === true) throw new SyntaxError(syntaxError("closing", ")"));
			state.output = utils$4.escapeLast(state.output, "(");
			decrement("parens");
		}
		while (state.braces > 0) {
			if (opts.strictBrackets === true) throw new SyntaxError(syntaxError("closing", "}"));
			state.output = utils$4.escapeLast(state.output, "{");
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
		const create = (str) => {
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
					const source$1 = create(match[1]);
					if (!source$1) return;
					return source$1 + DOT_LITERAL$1 + match[2];
				}
			}
		};
		let source = create(utils$4.removePrefix(input, state));
		if (source && opts.strictSlashes !== true) source += `${SLASH_LITERAL$1}?`;
		return source;
	};
	module.exports = parse$1;
}));
var require_picomatch$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const scan = require_scan();
	const parse = require_parse();
	const utils$3 = require_utils$1();
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
		const regex$1 = isState ? picomatch$2.compileRe(glob$1, options) : picomatch$2.makeRe(glob$1, options, false, true);
		const state = regex$1.state;
		delete regex$1.state;
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
			const { isMatch, match, output } = picomatch$2.test(input, regex$1, options, {
				glob: glob$1,
				posix: posix$1
			});
			const result = {
				glob: glob$1,
				state,
				regex: regex$1,
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
	picomatch$2.test = (input, regex$1, options, { glob: glob$1, posix: posix$1 } = {}) => {
		if (typeof input !== "string") throw new TypeError("Expected input to be a string");
		if (input === "") return {
			isMatch: false,
			output: ""
		};
		const opts = options || {};
		const format = opts.format || (posix$1 ? utils$3.toPosixSlashes : null);
		let match = input === glob$1;
		let output = match && format ? format(input) : input;
		if (match === false) {
			output = format ? format(input) : input;
			match = output === glob$1;
		}
		if (match === false || opts.capture === true) if (opts.matchBase === true || opts.basename === true) match = picomatch$2.matchBase(input, regex$1, options, posix$1);
		else match = regex$1.exec(output);
		return {
			isMatch: Boolean(match),
			match,
			output
		};
	};
	picomatch$2.matchBase = (input, glob$1, options) => {
		return (glob$1 instanceof RegExp ? glob$1 : picomatch$2.makeRe(glob$1, options)).test(utils$3.basename(input));
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
		const regex$1 = picomatch$2.toRegex(source, options);
		if (returnState === true) regex$1.state = state;
		return regex$1;
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
	const utils$2 = require_utils$1();
	function picomatch$1(glob$1, options, returnState = false) {
		if (options && (options.windows === null || options.windows === void 0)) options = {
			...options,
			windows: utils$2.isWindows()
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
	for (let i = 0; i < patternsCount; i++) {
		const parts = splitPattern(patterns[i]);
		patternsParts[i] = parts;
		const partsCount = parts.length;
		const partMatchers = Array(partsCount);
		for (let j$1 = 0; j$1 < partsCount; j$1++) partMatchers[j$1] = (0, import_picomatch.default)(parts[j$1], options);
		matchers[i] = partMatchers;
	}
	return (input) => {
		const inputParts = input.split("/");
		if (inputParts[0] === ".." && ONLY_PARENT_DIRECTORIES.test(input)) return true;
		for (let i = 0; i < patterns.length; i++) {
			const patternParts = patternsParts[i];
			const matcher = matchers[i];
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
function log(...tasks) {
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
		const n$1 = (parentDirectoryMatch[0].length + 1) / 3;
		let i = 0;
		const cwdParts = escapedCwd.split("/");
		while (i < n$1 && parts[i + n$1] === cwdParts[cwdParts.length + i - n$1]) {
			result = result.slice(0, (n$1 - i - 1) * 3) + result.slice((n$1 - i) * 3 + parts[i + n$1].length + 1) || ".";
			i++;
		}
		const potentialRoot = posix.join(cwd, parentDirectoryMatch[0].slice(i * 3));
		if (!potentialRoot.startsWith(".") && props.root.length > potentialRoot.length) {
			props.root = potentialRoot;
			props.depthOffset = -n$1 + i;
		}
	}
	if (!isIgnore && props.depthOffset >= 0) {
		var _props$commonPath;
		(_props$commonPath = props.commonPath) !== null && _props$commonPath !== void 0 || (props.commonPath = parts);
		const newCommonPath = [];
		const length = Math.min(props.commonPath.length, parts.length);
		for (let i = 0; i < length; i++) {
			const part = parts[i];
			if (part === "**" && !parts[i + 1]) {
				newCommonPath.pop();
				break;
			}
			if (part !== props.commonPath[i] || isDynamicPattern(part) || i === parts.length - 1) break;
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
	for (let i = paths.length - 1; i >= 0; i--) {
		const path$1 = paths[i];
		paths[i] = relative$1(path$1);
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
	if (options.debug) log("globbing with:", {
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
	if (options.debug) log("internal processing patterns:", processed);
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
		filters: [options.debug ? (p$1, isDirectory$1) => {
			const path$1 = format(p$1, isDirectory$1);
			const matches = matcher(path$1);
			if (matches) log(`matched ${path$1}`);
			return matches;
		} : (p$1, isDirectory$1) => matcher(format(p$1, isDirectory$1))],
		exclude: options.debug ? (_, p$1) => {
			const relativePath = formatExclude(p$1, true);
			const skipped = relativePath !== "." && !partialMatcher(relativePath) || ignore(relativePath);
			if (skipped) log(`skipped ${p$1}`);
			else log(`crawling ${p$1}`);
			return skipped;
		} : (_, p$1) => {
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
	if (options.debug) log("internal properties:", props);
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
const homeDirectory = F.homedir();
const { env: env$2 } = process;
const xdgData = env$2.XDG_DATA_HOME || (homeDirectory ? path.join(homeDirectory, ".local", "share") : void 0);
const xdgConfig = env$2.XDG_CONFIG_HOME || (homeDirectory ? path.join(homeDirectory, ".config") : void 0);
env$2.XDG_STATE_HOME || homeDirectory && path.join(homeDirectory, ".local", "state");
env$2.XDG_CACHE_HOME || homeDirectory && path.join(homeDirectory, ".cache");
env$2.XDG_RUNTIME_DIR;
const xdgDataDirectories = (env$2.XDG_DATA_DIRS || "/usr/local/share/:/usr/share/").split(":");
if (xdgData) xdgDataDirectories.unshift(xdgData);
const xdgConfigDirectories = (env$2.XDG_CONFIG_DIRS || "/etc/xdg").split(":");
if (xdgConfig) xdgConfigDirectories.unshift(xdgConfig);
const DEFAULT_RECENT_DAYS = 3;
const BLOCKS_WARNING_THRESHOLD = .8;
const BLOCKS_COMPACT_WIDTH_THRESHOLD = 120;
const BLOCKS_DEFAULT_TERMINAL_WIDTH = 120;
const DEBUG_MATCH_THRESHOLD_PERCENT = .1;
const USER_HOME_DIR = homedir();
const XDG_CONFIG_DIR = xdgConfig ?? path.join(USER_HOME_DIR, ".config");
const DEFAULT_CLAUDE_CODE_PATH = ".claude";
const DEFAULT_CLAUDE_CONFIG_PATH = path.join(XDG_CONFIG_DIR, "claude");
const CLAUDE_CONFIG_DIR_ENV = "CLAUDE_CONFIG_DIR";
const CLAUDE_PROJECTS_DIR_NAME = "projects";
const USAGE_DATA_GLOB_PATTERN = "**/*.jsonl";
const DEFAULT_REFRESH_INTERVAL_SECONDS = 1;
const DEFAULT_CONTEXT_USAGE_THRESHOLDS = {
	LOW: 50,
	MEDIUM: 80
};
const WEEK_DAYS = [
	"sunday",
	"monday",
	"tuesday",
	"wednesday",
	"thursday",
	"friday",
	"saturday"
];
const CONFIG_FILE_NAME = "ccusage.json";
const DEFAULT_LOCALE = "en-CA";
var castComparer = function(comparer) {
	return function(a$1, b$1, order) {
		return comparer(a$1, b$1, order) * order;
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
	return function multiPropertySorter(sortBy, sortByArr, depth$1, order, comparer, a$1, b$1) {
		var valA;
		var valB;
		if (typeof sortBy === "string") {
			valA = a$1[sortBy];
			valB = b$1[sortBy];
		} else if (typeof sortBy === "function") {
			valA = sortBy(a$1);
			valB = sortBy(b$1);
		} else {
			var objectSorterConfig = unpackObjectSorter(sortBy);
			return multiPropertySorter(objectSorterConfig.sortBy, sortByArr, depth$1, objectSorterConfig.order, objectSorterConfig.comparer || defaultComparer$1, a$1, b$1);
		}
		var equality = comparer(valA, valB, order);
		if ((equality === 0 || valA == null && valB == null) && sortByArr.length > depth$1) return multiPropertySorter(sortByArr[depth$1], sortByArr, depth$1 + 1, order, comparer, a$1, b$1);
		return equality;
	};
};
function getSortStrategy(sortBy, comparer, order) {
	if (sortBy === void 0 || sortBy === true) return function(a$1, b$1) {
		return comparer(a$1, b$1, order);
	};
	if (typeof sortBy === "string") {
		throwInvalidConfigErrorIfTrue(sortBy.includes("."), "String syntax not allowed for nested properties.");
		return function(a$1, b$1) {
			return comparer(a$1[sortBy], b$1[sortBy], order);
		};
	}
	if (typeof sortBy === "function") return function(a$1, b$1) {
		return comparer(sortBy(a$1), sortBy(b$1), order);
	};
	if (Array.isArray(sortBy)) {
		var multiPropSorter_1 = multiPropertySorterProvider(comparer);
		return function(a$1, b$1) {
			return multiPropSorter_1(sortBy[0], sortBy, 1, order, comparer, a$1, b$1);
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
var defaultComparer = function(a$1, b$1, order) {
	if (a$1 == null) return order;
	if (b$1 == null) return -order;
	if (typeof a$1 !== typeof b$1) return typeof a$1 < typeof b$1 ? -1 : 1;
	if (a$1 < b$1) return -1;
	if (a$1 > b$1) return 1;
	return 0;
};
var sort = createNewSortInstance({ comparer: defaultComparer });
createNewSortInstance({
	comparer: defaultComparer,
	inPlaceSorting: true
});
function _usingCtx() {
	var r = "function" == typeof SuppressedError ? SuppressedError : function(r$1, e$1) {
		var n$2 = Error();
		return n$2.name = "SuppressedError", n$2.error = r$1, n$2.suppressed = e$1, n$2;
	}, e = {}, n$1 = [];
	function using(r$1, e$1) {
		if (null != e$1) {
			if (Object(e$1) !== e$1) throw new TypeError("using declarations can only be used with objects, functions, null, or undefined.");
			if (r$1) var o = e$1[Symbol.asyncDispose || Symbol["for"]("Symbol.asyncDispose")];
			if (void 0 === o && (o = e$1[Symbol.dispose || Symbol["for"]("Symbol.dispose")], r$1)) var t = o;
			if ("function" != typeof o) throw new TypeError("Object is not disposable.");
			t && (o = function o$1() {
				try {
					t.call(e$1);
				} catch (r$2) {
					return Promise.reject(r$2);
				}
			}), n$1.push({
				v: e$1,
				d: o,
				a: r$1
			});
		} else r$1 && n$1.push({
			d: e$1,
			a: r$1
		});
		return e$1;
	}
	return {
		e,
		u: using.bind(null, !1),
		a: using.bind(null, !0),
		d: function d$1() {
			var o, t = this.e, s = 0;
			function next() {
				for (; o = n$1.pop();) try {
					if (!o.a && 1 === s) return s = 0, n$1.push(o), Promise.resolve().then(next);
					if (o.d) {
						var r$1 = o.d.call(o.v);
						if (o.a) return s |= 2, Promise.resolve(r$1).then(next, err);
					} else s |= 1;
				} catch (r$2) {
					return err(r$2);
				}
				if (1 === s) return t !== e ? Promise.reject(t) : Promise.resolve();
				if (t !== e) throw t;
			}
			function err(n$2) {
				return t = t !== e ? new r(n$2, t) : n$2, next();
			}
			return next();
		}
	};
}
function unreachable(value) {
	throw new Error(`Unreachable code reached with value: ${value}`);
}
async function getFileModifiedTime(filePath) {
	return pipe(try_({
		try: stat(filePath),
		catch: (error) => error
	}), map$1((stats) => stats.mtime.getTime()), unwrap(0));
}
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
	const ansiRegex$1 = require_ansi_regex();
	module.exports = (string$1) => typeof string$1 === "string" ? string$1.replace(ansiRegex$1(), "") : string$1;
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
	const stripAnsi$1 = require_strip_ansi();
	const isFullwidthCodePoint = require_is_fullwidth_code_point();
	const emojiRegex$1 = require_emoji_regex$1();
	const stringWidth$2 = (string$1) => {
		if (typeof string$1 !== "string" || string$1.length === 0) return 0;
		string$1 = stripAnsi$1(string$1);
		if (string$1.length === 0) return 0;
		string$1 = string$1.replace(emojiRegex$1(), "  ");
		let width = 0;
		for (let i = 0; i < string$1.length; i++) {
			const code = string$1.codePointAt(i);
			if (code <= 31 || code >= 127 && code <= 159) continue;
			if (code >= 768 && code <= 879) continue;
			if (code > 65535) i++;
			width += isFullwidthCodePoint(code) ? 2 : 1;
		}
		return width;
	};
	module.exports = stringWidth$2;
	module.exports.default = stringWidth$2;
}));
var require_utils = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const stringWidth$1 = require_string_width();
	function codeRegex(capture) {
		return capture ? /\u001b\[((?:\d*;){0,5}\d*)m/g : /\u001b\[(?:\d*;){0,5}\d*m/g;
	}
	function strlen(str) {
		let code = codeRegex();
		return ("" + str).replace(code, "").split("\n").reduce(function(memo, s) {
			return stringWidth$1(s) > memo ? stringWidth$1(s) : memo;
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
	function addToCodeCache(name, on, off) {
		on = "\x1B[" + on + "m";
		off = "\x1B[" + off + "m";
		codeCache[on] = {
			set: name,
			to: true
		};
		codeCache[off] = {
			set: name,
			to: false
		};
		codeCache[name] = {
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
			for (let i in state)
 /* istanbul ignore else */
			if (Object.prototype.hasOwnProperty.call(state, i)) delete state[i];
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
		for (let i = 0; i < split.length; i += 2) {
			let word = split[i];
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
			whitespace = split[i + 1];
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
		for (let i = 0; i < split.length; i += 2) pushLine(split[i], i && split[i - 1]);
		if (line.length) lines.push(line);
		return lines;
	}
	function multiLineWordWrap(maxLength, input, wrapOnWordBoundary = true) {
		let output = [];
		input = input.split("\n");
		const handler = wrapOnWordBoundary ? wordWrap : textWrap;
		for (let i = 0; i < input.length; i++) output.push.apply(output, handler(maxLength, input[i]));
		return output;
	}
	function colorizeLines(input) {
		let state = {};
		let output = [];
		for (let i = 0; i < input.length; i++) {
			let line = rewindState(state, input[i]);
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
	module.exports = function(flag, argv$1) {
		argv$1 = argv$1 || process.argv;
		var terminatorPos = argv$1.indexOf("--");
		var prefix = /^-{1,2}/.test(flag) ? "" : "--";
		var pos = argv$1.indexOf(prefix + flag);
		return pos !== -1 && (terminatorPos === -1 ? true : pos < terminatorPos);
	};
}));
var require_supports_colors = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var os = __require$1("node:os");
	var hasFlag = require_has_flag();
	var env$1 = process.env;
	var forceColor = void 0;
	if (hasFlag("no-color") || hasFlag("no-colors") || hasFlag("color=false")) forceColor = false;
	else if (hasFlag("color") || hasFlag("colors") || hasFlag("color=true") || hasFlag("color=always")) forceColor = true;
	if ("FORCE_COLOR" in env$1) forceColor = env$1.FORCE_COLOR.length === 0 || parseInt(env$1.FORCE_COLOR, 10) !== 0;
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
			var osRelease = os.release().split(".");
			if (Number(process.versions.node.split(".")[0]) >= 8 && Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) return Number(osRelease[2]) >= 14931 ? 3 : 2;
			return 1;
		}
		if ("CI" in env$1) {
			if ([
				"TRAVIS",
				"CIRCLECI",
				"APPVEYOR",
				"GITLAB_CI"
			].some(function(sign) {
				return sign in env$1;
			}) || env$1.CI_NAME === "codeship") return 1;
			return min;
		}
		if ("TEAMCITY_VERSION" in env$1) return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env$1.TEAMCITY_VERSION) ? 1 : 0;
		if ("TERM_PROGRAM" in env$1) {
			var version = parseInt((env$1.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
			switch (env$1.TERM_PROGRAM) {
				case "iTerm.app": return version >= 3 ? 3 : 2;
				case "Hyper": return 3;
				case "Apple_Terminal": return 2;
			}
		}
		if (/-256(color)?$/i.test(env$1.TERM)) return 2;
		if (/^screen|^xterm|^vt100|^rxvt|color|ansi|cygwin|linux/i.test(env$1.TERM)) return 1;
		if ("COLORTERM" in env$1) return 1;
		if (env$1.TERM === "dumb") return min;
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
		text.forEach(function(c) {
			c = c.toLowerCase();
			var chars = trap[c] || [" "];
			var rand = Math.floor(Math.random() * chars.length);
			if (typeof trap[c] !== "undefined") result += trap[c][rand];
			else result += c;
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
			all.filter(function(i) {
				bool = i === character;
			});
			return bool;
		}
		function heComes(text$1, options$1) {
			var result = "";
			var counts;
			var l$1;
			options$1 = options$1 || {};
			options$1["up"] = typeof options$1["up"] !== "undefined" ? options$1["up"] : true;
			options$1["mid"] = typeof options$1["mid"] !== "undefined" ? options$1["mid"] : true;
			options$1["down"] = typeof options$1["down"] !== "undefined" ? options$1["down"] : true;
			options$1["size"] = typeof options$1["size"] !== "undefined" ? options$1["size"] : "maxi";
			text$1 = text$1.split("");
			for (l$1 in text$1) {
				if (isChar(l$1)) continue;
				result = result + text$1[l$1];
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
					for (var i = 0; i <= counts[index]; i++) if (options$1[index]) result = result + soul[index][randomNumber(soul[index].length)];
				}
			}
			return result;
		}
		return heComes(text, options);
	};
}));
var require_america = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module["exports"] = function(colors$2) {
		return function(letter, i, exploded) {
			if (letter === " ") return letter;
			switch (i % 3) {
				case 0: return colors$2.red(letter);
				case 1: return colors$2.white(letter);
				case 2: return colors$2.blue(letter);
			}
		};
	};
}));
var require_zebra = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module["exports"] = function(colors$2) {
		return function(letter, i, exploded) {
			return i % 2 === 0 ? letter : colors$2.inverse(letter);
		};
	};
}));
var require_rainbow = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module["exports"] = function(colors$2) {
		var rainbowColors = [
			"red",
			"yellow",
			"green",
			"blue",
			"magenta"
		];
		return function(letter, i, exploded) {
			if (letter === " ") return letter;
			else return colors$2[rainbowColors[i++ % rainbowColors.length]](letter);
		};
	};
}));
var require_random = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module["exports"] = function(colors$2) {
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
		return function(letter, i, exploded) {
			return letter === " " ? letter : colors$2[available[Math.round(Math.random() * (available.length - 2))]](letter);
		};
	};
}));
var require_colors = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var colors$1 = {};
	module["exports"] = colors$1;
	colors$1.themes = {};
	var util = __require$1("node:util");
	var ansiStyles = colors$1.styles = require_styles();
	var defineProps = Object.defineProperties;
	var newLineRegex = /* @__PURE__ */ new RegExp(/[\r\n]+/g);
	colors$1.supportsColor = require_supports_colors().supportsColor;
	if (typeof colors$1.enabled === "undefined") colors$1.enabled = colors$1.supportsColor() !== false;
	colors$1.enable = function() {
		colors$1.enabled = true;
	};
	colors$1.disable = function() {
		colors$1.enabled = false;
	};
	colors$1.stripColors = colors$1.strip = function(str) {
		return ("" + str).replace(/\x1B\[\d+m/g, "");
	};
	colors$1.stylize = function stylize(str, style) {
		if (!colors$1.enabled) return str + "";
		var styleMap = ansiStyles[style];
		if (!styleMap && style in colors$1) return colors$1[style](str);
		return styleMap.open + str + styleMap.close;
	};
	var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;
	var escapeStringRegexp = function(str) {
		if (typeof str !== "string") throw new TypeError("Expected a string");
		return str.replace(matchOperatorsRe, "\\$&");
	};
	function build(_styles) {
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
				return build(this._styles.concat(key));
			} };
		});
		return ret;
	})();
	var proto = defineProps(function colors$2() {}, styles);
	function applyStyle() {
		var str = Array.prototype.slice.call(arguments).map(function(arg) {
			if (arg != null && arg.constructor === String) return arg;
			else return util.inspect(arg);
		}).join(" ");
		if (!colors$1.enabled || !str) return str;
		var newLinesPresent = str.indexOf("\n") != -1;
		var nestedStyles = this._styles;
		var i = nestedStyles.length;
		while (i--) {
			var code = ansiStyles[nestedStyles[i]];
			str = code.open + str.replace(code.closeRe, code.open) + code.close;
			if (newLinesPresent) str = str.replace(newLineRegex, function(match) {
				return code.close + match + code.open;
			});
		}
		return str;
	}
	colors$1.setTheme = function(theme) {
		if (typeof theme === "string") {
			console.log("colors.setTheme now only accepts an object, not a string.  If you are trying to set a theme from a file, it is now your (the caller's) responsibility to require the file.  The old syntax looked like colors.setTheme(__dirname + '/../themes/generic-logging.js'); The new syntax looks like colors.setTheme(require(__dirname + '/../themes/generic-logging.js'));");
			return;
		}
		for (var style in theme) (function(style$1) {
			colors$1[style$1] = function(str) {
				if (typeof theme[style$1] === "object") {
					var out = str;
					for (var i in theme[style$1]) out = colors$1[theme[style$1][i]](out);
					return out;
				}
				return colors$1[theme[style$1]](str);
			};
		})(style);
	};
	function init() {
		var ret = {};
		Object.keys(styles).forEach(function(name) {
			ret[name] = { get: function() {
				return build([name]);
			} };
		});
		return ret;
	}
	var sequencer = function sequencer$1(map$2, str) {
		var exploded = str.split("");
		exploded = exploded.map(map$2);
		return exploded.join("");
	};
	colors$1.trap = require_trap();
	colors$1.zalgo = require_zalgo();
	colors$1.maps = {};
	colors$1.maps.america = require_america()(colors$1);
	colors$1.maps.zebra = require_zebra()(colors$1);
	colors$1.maps.rainbow = require_rainbow()(colors$1);
	colors$1.maps.random = require_random()(colors$1);
	for (var map in colors$1.maps) (function(map$2) {
		colors$1[map$2] = function(str) {
			return sequencer(colors$1.maps[map$2], str);
		};
	})(map);
	defineProps(colors$1, init());
}));
var require_safe = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module["exports"] = require_colors();
}));
var require_cell = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { info, debug: debug$2 } = require_debug();
	const utils$1 = require_utils();
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
			CHAR_NAMES.forEach(function(name) {
				setOption(optionsChars, tableChars, name, chars);
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
			this.desiredWidth = utils$1.strlen(this.content) + this.paddingLeft + this.paddingRight;
			this.desiredHeight = this.lines.length;
		}
		computeLines(tableOptions) {
			const tableWordWrap = tableOptions.wordWrap || tableOptions.textWrap;
			const { wordWrap: wordWrap$1 = tableWordWrap } = this.options;
			if (this.fixedWidth && wordWrap$1) {
				this.fixedWidth -= this.paddingLeft + this.paddingRight;
				if (this.colSpan) {
					let i = 1;
					while (i < this.colSpan) {
						this.fixedWidth += tableOptions.colWidths[this.x + i];
						i++;
					}
				}
				const { wrapOnWordBoundary: tableWrapOnWordBoundary = true } = tableOptions;
				const { wrapOnWordBoundary = tableWrapOnWordBoundary } = this.options;
				return this.wrapLines(utils$1.wordWrap(this.fixedWidth, this.content, wrapOnWordBoundary));
			}
			return this.wrapLines(this.content.split("\n"));
		}
		wrapLines(computedLines) {
			const lines = utils$1.colorizeLines(computedLines);
			if (this.href) return lines.map((line) => utils$1.hyperlink(this.href, line));
			return lines;
		}
		init(tableOptions) {
			let x = this.x;
			let y$1 = this.y;
			this.widths = tableOptions.colWidths.slice(x, x + this.colSpan);
			this.heights = tableOptions.rowHeights.slice(y$1, y$1 + this.rowSpan);
			this.width = this.widths.reduce(sumPlusOne, -1);
			this.height = this.heights.reduce(sumPlusOne, -1);
			this.hAlign = this.options.hAlign || tableOptions.colAligns[x];
			this.vAlign = this.options.vAlign || tableOptions.rowAligns[y$1];
			this.drawRight = x + this.colSpan == tableOptions.colWidths.length;
		}
		draw(lineNum, spanningCell) {
			if (lineNum == "top") return this.drawTop(this.drawRight);
			if (lineNum == "bottom") return this.drawBottom(this.drawRight);
			let content = utils$1.truncate(this.content, 10, this.truncate);
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
				content.push(utils$1.repeat(this.chars[this.y == 0 ? "top" : "mid"], width));
			}, this);
			else {
				content.push(this._topLeftChar(0));
				content.push(utils$1.repeat(this.chars[this.y == 0 ? "top" : "mid"], this.width));
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
						let i = 1;
						while (this.cells[this.y][x - i] instanceof Cell$1.ColSpanCell) i++;
						if (this.cells[this.y][x - i] instanceof Cell$1.RowSpanCell) leftChar = "leftMid";
					}
				}
			}
			return this.chars[leftChar];
		}
		wrapWithStyleColors(styleProperty, content) {
			if (this[styleProperty] && this[styleProperty].length) try {
				let colors$2 = require_safe();
				for (let i = this[styleProperty].length - 1; i >= 0; i--) colors$2 = colors$2[this[styleProperty][i]];
				return colors$2(content);
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
			let leftPadding = utils$1.repeat(" ", this.paddingLeft);
			let right = drawRight ? this.chars["right"] : "";
			let rightPadding = utils$1.repeat(" ", this.paddingRight);
			let line = this.lines[lineNum];
			let len = this.width - (this.paddingLeft + this.paddingRight);
			if (forceTruncationSymbol) line += this.truncate || "…";
			let content = utils$1.truncate(line, len, this.truncate);
			content = utils$1.pad(content, len, " ", this.hAlign);
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
			let content = utils$1.repeat(this.chars.bottom, this.width);
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
			let content = utils$1.repeat(" ", this.width);
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
			let y$1 = this.y;
			let originalY = this.originalCell.y;
			this.cellOffset = y$1 - originalY;
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
		for (let i = 1; i < span; i++) ret += 1 + dimensionTable[startingIndex + i];
		return ret;
	}
	function sumPlusOne(a$1, b$1) {
		return a$1 + b$1 + 1;
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
		function conflictExists(rows, x, y$1) {
			let i_max = Math.min(rows.length - 1, y$1);
			let cell = {
				x,
				y: y$1
			};
			for (let i = 0; i <= i_max; i++) {
				let row = rows[i];
				for (let j$1 = 0; j$1 < row.length; j$1++) if (cellsConflict(cell, row[j$1])) return true;
			}
			return false;
		}
		function allBlank(rows, y$1, xMin, xMax) {
			for (let x = xMin; x < xMax; x++) if (conflictExists(rows, x, y$1)) return false;
			return true;
		}
		function addRowSpanCells(table) {
			table.forEach(function(row, rowIndex) {
				row.forEach(function(cell) {
					for (let i = 1; i < cell.rowSpan; i++) {
						let rowSpanCell = new RowSpanCell(cell);
						rowSpanCell.x = cell.x;
						rowSpanCell.y = cell.y + i;
						rowSpanCell.colSpan = cell.colSpan;
						insertCell(rowSpanCell, table[rowIndex + i]);
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
			for (let y$1 = 0; y$1 < h_max; y$1++) for (let x = 0; x < w_max; x++) if (!conflictExists(table, x, y$1)) {
				let opts = {
					x,
					y: y$1,
					colSpan: 1,
					rowSpan: 1
				};
				x++;
				while (x < w_max && !conflictExists(table, x, y$1)) {
					opts.colSpan++;
					x++;
				}
				let y2 = y$1 + 1;
				while (y2 < h_max && allBlank(table, y2, opts.x, opts.x + opts.colSpan)) {
					opts.rowSpan++;
					y2++;
				}
				let cell = new Cell(opts);
				cell.x = opts.x;
				cell.y = opts.y;
				warn(`Missing cell at ${cell.y}-${cell.x}.`);
				insertCell(cell, table[y$1]);
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
				if (typeof existingWidth === "number") for (let i = 1; i < span; i++) {
					existingWidth += 1 + result[col + i];
					if (typeof vals[col + i] !== "number") editableCols++;
				}
				else {
					existingWidth = desiredWidth === "desiredWidth" ? cell.desiredWidth - 1 : 1;
					if (!auto[col] || auto[col] < existingWidth) auto[col] = existingWidth;
				}
				if (cell[desiredWidth] > existingWidth) {
					let i = 0;
					while (editableCols > 0 && cell[desiredWidth] > existingWidth) {
						if (typeof vals[col + i] !== "number") {
							let dif = Math.round((cell[desiredWidth] - existingWidth) / editableCols);
							existingWidth += dif;
							result[col + i] += dif;
							editableCols--;
						}
						i++;
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
	const utils = require_utils();
	const tableLayout = require_layout_manager();
	var Table$1 = class extends Array {
		constructor(opts) {
			super();
			const options = utils.mergeOptions(opts);
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
			let array$1 = this;
			let headersPresent = this.options.head && this.options.head.length;
			if (headersPresent) {
				array$1 = [this.options.head];
				if (this.length) array$1.push.apply(array$1, this);
			} else this.options.style.head = [];
			let cells = tableLayout.makeTableLayout(array$1);
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
var require_picocolors = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	let p = process || {}, argv = p.argv || [], env = p.env || {};
	let isColorSupported = !(!!env.NO_COLOR || argv.includes("--no-color")) && (!!env.FORCE_COLOR || argv.includes("--color") || p.platform === "win32" || (p.stdout || {}).isTTY && env.TERM !== "dumb" || !!env.CI);
	let formatter = (open, close, replace = open) => (input) => {
		let string$1 = "" + input, index = string$1.indexOf(close, open.length);
		return ~index ? open + replaceClose(string$1, close, replace, index) + close : open + string$1 + close;
	};
	let replaceClose = (string$1, close, replace, index) => {
		let result = "", cursor = 0;
		do {
			result += string$1.substring(cursor, index) + replace;
			cursor = index + close.length;
			index = string$1.indexOf(close, cursor);
		} while (~index);
		return result + string$1.substring(cursor);
	};
	let createColors = (enabled = isColorSupported) => {
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
	module.exports = createColors();
	module.exports.createColors = createColors;
}));
function ansiRegex({ onlyFirst = false } = {}) {
	return new RegExp(`(?:\\u001B\\][\\s\\S]*?(?:\\u0007|\\u001B\\u005C|\\u009C))|[\\u001B\\u009B][[\\]()#;?]*(?:\\d{1,4}(?:[;:]\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]`, onlyFirst ? void 0 : "g");
}
const regex = ansiRegex();
function stripAnsi(string$1) {
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
	return x >= 4352 && x <= 4447 || x === 8986 || x === 8987 || x === 9001 || x === 9002 || x >= 9193 && x <= 9196 || x === 9200 || x === 9203 || x === 9725 || x === 9726 || x === 9748 || x === 9749 || x >= 9776 && x <= 9783 || x >= 9800 && x <= 9811 || x === 9855 || x >= 9866 && x <= 9871 || x === 9875 || x === 9889 || x === 9898 || x === 9899 || x === 9917 || x === 9918 || x === 9924 || x === 9925 || x === 9934 || x === 9940 || x === 9962 || x === 9970 || x === 9971 || x === 9973 || x === 9978 || x === 9981 || x === 9989 || x === 9994 || x === 9995 || x === 10024 || x === 10060 || x === 10062 || x >= 10067 && x <= 10069 || x === 10071 || x >= 10133 && x <= 10135 || x === 10160 || x === 10175 || x === 11035 || x === 11036 || x === 11088 || x === 11093 || x >= 11904 && x <= 11929 || x >= 11931 && x <= 12019 || x >= 12032 && x <= 12245 || x >= 12272 && x <= 12287 || x >= 12289 && x <= 12350 || x >= 12353 && x <= 12438 || x >= 12441 && x <= 12543 || x >= 12549 && x <= 12591 || x >= 12593 && x <= 12686 || x >= 12688 && x <= 12773 || x >= 12783 && x <= 12830 || x >= 12832 && x <= 12871 || x >= 12880 && x <= 42124 || x >= 42128 && x <= 42182 || x >= 43360 && x <= 43388 || x >= 44032 && x <= 55203 || x >= 63744 && x <= 64255 || x >= 65040 && x <= 65049 || x >= 65072 && x <= 65106 || x >= 65108 && x <= 65126 || x >= 65128 && x <= 65131 || x >= 94176 && x <= 94180 || x >= 94192 && x <= 94198 || x >= 94208 && x <= 101589 || x >= 101631 && x <= 101662 || x >= 101760 && x <= 101874 || x >= 110576 && x <= 110579 || x >= 110581 && x <= 110587 || x === 110589 || x === 110590 || x >= 110592 && x <= 110882 || x === 110898 || x >= 110928 && x <= 110930 || x === 110933 || x >= 110948 && x <= 110951 || x >= 110960 && x <= 111355 || x >= 119552 && x <= 119638 || x >= 119648 && x <= 119670 || x === 126980 || x === 127183 || x === 127374 || x >= 127377 && x <= 127386 || x >= 127488 && x <= 127490 || x >= 127504 && x <= 127547 || x >= 127552 && x <= 127560 || x === 127568 || x === 127569 || x >= 127584 && x <= 127589 || x >= 127744 && x <= 127776 || x >= 127789 && x <= 127797 || x >= 127799 && x <= 127868 || x >= 127870 && x <= 127891 || x >= 127904 && x <= 127946 || x >= 127951 && x <= 127955 || x >= 127968 && x <= 127984 || x === 127988 || x >= 127992 && x <= 128062 || x === 128064 || x >= 128066 && x <= 128252 || x >= 128255 && x <= 128317 || x >= 128331 && x <= 128334 || x >= 128336 && x <= 128359 || x === 128378 || x === 128405 || x === 128406 || x === 128420 || x >= 128507 && x <= 128591 || x >= 128640 && x <= 128709 || x === 128716 || x >= 128720 && x <= 128722 || x >= 128725 && x <= 128728 || x >= 128732 && x <= 128735 || x === 128747 || x === 128748 || x >= 128756 && x <= 128764 || x >= 128992 && x <= 129003 || x === 129008 || x >= 129292 && x <= 129338 || x >= 129340 && x <= 129349 || x >= 129351 && x <= 129535 || x >= 129648 && x <= 129660 || x >= 129664 && x <= 129674 || x >= 129678 && x <= 129734 || x === 129736 || x >= 129741 && x <= 129756 || x >= 129759 && x <= 129770 || x >= 129775 && x <= 129784 || x >= 131072 && x <= 196605 || x >= 196608 && x <= 262141;
}
function validate(codePoint) {
	if (!Number.isSafeInteger(codePoint)) throw new TypeError(`Expected a code point, got \`${typeof codePoint}\`.`);
}
function eastAsianWidth(codePoint, { ambiguousAsWide = false } = {}) {
	validate(codePoint);
	if (isFullWidth(codePoint) || isWide(codePoint) || ambiguousAsWide && isAmbiguous(codePoint)) return 2;
	return 1;
}
var import_emoji_regex = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = () => {
		return /[#*0-9]\uFE0F?\u20E3|[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23ED-\u23EF\u23F1\u23F2\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692\u2694-\u2697\u2699\u269B\u269C\u26A0\u26A7\u26AA\u26B0\u26B1\u26BD\u26BE\u26C4\u26C8\u26CF\u26D1\u26E9\u26F0-\u26F5\u26F7\u26F8\u26FA\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2757\u2763\u27A1\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B55\u3030\u303D\u3297\u3299]\uFE0F?|[\u261D\u270C\u270D](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?|[\u270A\u270B](?:\uD83C[\uDFFB-\uDFFF])?|[\u23E9-\u23EC\u23F0\u23F3\u25FD\u2693\u26A1\u26AB\u26C5\u26CE\u26D4\u26EA\u26FD\u2705\u2728\u274C\u274E\u2753-\u2755\u2795-\u2797\u27B0\u27BF\u2B50]|\u26D3\uFE0F?(?:\u200D\uD83D\uDCA5)?|\u26F9(?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|\u2764\uFE0F?(?:\u200D(?:\uD83D\uDD25|\uD83E\uDE79))?|\uD83C(?:[\uDC04\uDD70\uDD71\uDD7E\uDD7F\uDE02\uDE37\uDF21\uDF24-\uDF2C\uDF36\uDF7D\uDF96\uDF97\uDF99-\uDF9B\uDF9E\uDF9F\uDFCD\uDFCE\uDFD4-\uDFDF\uDFF5\uDFF7]\uFE0F?|[\uDF85\uDFC2\uDFC7](?:\uD83C[\uDFFB-\uDFFF])?|[\uDFC4\uDFCA](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDFCB\uDFCC](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDCCF\uDD8E\uDD91-\uDD9A\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF43\uDF45-\uDF4A\uDF4C-\uDF7C\uDF7E-\uDF84\uDF86-\uDF93\uDFA0-\uDFC1\uDFC5\uDFC6\uDFC8\uDFC9\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF8-\uDFFF]|\uDDE6\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF]|\uDDE7\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF]|\uDDE8\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF7\uDDFA-\uDDFF]|\uDDE9\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF]|\uDDEA\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA]|\uDDEB\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7]|\uDDEC\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE]|\uDDED\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA]|\uDDEE\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9]|\uDDEF\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5]|\uDDF0\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF]|\uDDF1\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE]|\uDDF2\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF]|\uDDF3\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF]|\uDDF4\uD83C\uDDF2|\uDDF5\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE]|\uDDF6\uD83C\uDDE6|\uDDF7\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC]|\uDDF8\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF]|\uDDF9\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF]|\uDDFA\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF]|\uDDFB\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA]|\uDDFC\uD83C[\uDDEB\uDDF8]|\uDDFD\uD83C\uDDF0|\uDDFE\uD83C[\uDDEA\uDDF9]|\uDDFF\uD83C[\uDDE6\uDDF2\uDDFC]|\uDF44(?:\u200D\uD83D\uDFEB)?|\uDF4B(?:\u200D\uD83D\uDFE9)?|\uDFC3(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDFF3\uFE0F?(?:\u200D(?:\u26A7\uFE0F?|\uD83C\uDF08))?|\uDFF4(?:\u200D\u2620\uFE0F?|\uDB40\uDC67\uDB40\uDC62\uDB40(?:\uDC65\uDB40\uDC6E\uDB40\uDC67|\uDC73\uDB40\uDC63\uDB40\uDC74|\uDC77\uDB40\uDC6C\uDB40\uDC73)\uDB40\uDC7F)?)|\uD83D(?:[\uDC3F\uDCFD\uDD49\uDD4A\uDD6F\uDD70\uDD73\uDD76-\uDD79\uDD87\uDD8A-\uDD8D\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA\uDECB\uDECD-\uDECF\uDEE0-\uDEE5\uDEE9\uDEF0\uDEF3]\uFE0F?|[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC](?:\uD83C[\uDFFB-\uDFFF])?|[\uDC6E-\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4\uDEB5](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD74\uDD90](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?|[\uDC00-\uDC07\uDC09-\uDC14\uDC16-\uDC25\uDC27-\uDC3A\uDC3C-\uDC3E\uDC40\uDC44\uDC45\uDC51-\uDC65\uDC6A\uDC79-\uDC7B\uDC7D-\uDC80\uDC84\uDC88-\uDC8E\uDC90\uDC92-\uDCA9\uDCAB-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDDA4\uDDFB-\uDE2D\uDE2F-\uDE34\uDE37-\uDE41\uDE43\uDE44\uDE48-\uDE4A\uDE80-\uDEA2\uDEA4-\uDEB3\uDEB7-\uDEBF\uDEC1-\uDEC5\uDED0-\uDED2\uDED5-\uDED8\uDEDC-\uDEDF\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB\uDFF0]|\uDC08(?:\u200D\u2B1B)?|\uDC15(?:\u200D\uD83E\uDDBA)?|\uDC26(?:\u200D(?:\u2B1B|\uD83D\uDD25))?|\uDC3B(?:\u200D\u2744\uFE0F?)?|\uDC41\uFE0F?(?:\u200D\uD83D\uDDE8\uFE0F?)?|\uDC68(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDC68\uDC69]\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFC-\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFC-\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFD-\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFD\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFE])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFE]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?))?|\uDC69(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?[\uDC68\uDC69]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?|\uDC69\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?))|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFC-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFC-\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFD-\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFD\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFE])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFE]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFE])))?))?|\uDD75(?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|\uDE2E(?:\u200D\uD83D\uDCA8)?|\uDE35(?:\u200D\uD83D\uDCAB)?|\uDE36(?:\u200D\uD83C\uDF2B\uFE0F?)?|\uDE42(?:\u200D[\u2194\u2195]\uFE0F?)?|\uDEB6(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?)|\uD83E(?:[\uDD0C\uDD0F\uDD18-\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5\uDEC3-\uDEC5\uDEF0\uDEF2-\uDEF8](?:\uD83C[\uDFFB-\uDFFF])?|[\uDD26\uDD35\uDD37-\uDD39\uDD3C-\uDD3E\uDDB8\uDDB9\uDDCD\uDDCF\uDDD4\uDDD6-\uDDDD](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDDDE\uDDDF](?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD0D\uDD0E\uDD10-\uDD17\uDD20-\uDD25\uDD27-\uDD2F\uDD3A\uDD3F-\uDD45\uDD47-\uDD76\uDD78-\uDDB4\uDDB7\uDDBA\uDDBC-\uDDCC\uDDD0\uDDE0-\uDDFF\uDE70-\uDE7C\uDE80-\uDE8A\uDE8E-\uDEC2\uDEC6\uDEC8\uDECD-\uDEDC\uDEDF-\uDEEA\uDEEF]|\uDDCE(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDDD1(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1|\uDDD1\u200D\uD83E\uDDD2(?:\u200D\uD83E\uDDD2)?|\uDDD2(?:\u200D\uD83E\uDDD2)?))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE])))?))?|\uDEF1(?:\uD83C(?:\uDFFB(?:\u200D\uD83E\uDEF2\uD83C[\uDFFC-\uDFFF])?|\uDFFC(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFD-\uDFFF])?|\uDFFD(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])?|\uDFFE(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFD\uDFFF])?|\uDFFF(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFE])?))?)/g;
	};
})))(), 1);
const segmenter = new Intl.Segmenter();
const defaultIgnorableCodePointRegex = /^\p{Default_Ignorable_Code_Point}$/u;
function stringWidth(string$1, options = {}) {
	if (typeof string$1 !== "string" || string$1.length === 0) return 0;
	const { ambiguousIsNarrow = true, countAnsiEscapeCodes = false } = options;
	if (!countAnsiEscapeCodes) string$1 = stripAnsi(string$1);
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
		if ((0, import_emoji_regex.default)().test(character)) {
			width += 2;
			continue;
		}
		width += eastAsianWidth(codePoint, eastAsianWidthOptions);
	}
	return width;
}
var import_cli_table3 = /* @__PURE__ */ __toESM(require_cli_table3(), 1);
var import_picocolors = /* @__PURE__ */ __toESM(require_picocolors(), 1);
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
		if (this.compactHead == null || !this.compactMode) return Array.from({ length: this.head.length }, (_, i) => i);
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
		const contentWidths = head.map((_, colIndex) => {
			return Math.max(...allRows.map((row) => stringWidth(String(row[colIndex] ?? ""))));
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
function pushBreakdownRows(table, breakdowns, extraColumns = 1, trailingColumns = 0) {
	for (const breakdown of breakdowns) {
		const row = [`  └─ ${formatModelName(breakdown.modelName)}`];
		for (let i = 0; i < extraColumns; i++) row.push("");
		const totalTokens = breakdown.inputTokens + breakdown.outputTokens + breakdown.cacheCreationTokens + breakdown.cacheReadTokens;
		row.push(import_picocolors.default.gray(formatNumber(breakdown.inputTokens)), import_picocolors.default.gray(formatNumber(breakdown.outputTokens)), import_picocolors.default.gray(formatNumber(breakdown.cacheCreationTokens)), import_picocolors.default.gray(formatNumber(breakdown.cacheReadTokens)), import_picocolors.default.gray(formatNumber(totalTokens)), import_picocolors.default.gray(formatCurrency(breakdown.cost)));
		for (let i = 0; i < trailingColumns; i++) row.push("");
		table.push(row);
	}
}
function createUsageReportTable(config) {
	const baseHeaders = [
		config.firstColumnName,
		"Models",
		"Input",
		"Output",
		"Cache Create",
		"Cache Read",
		"Total Tokens",
		"Cost (USD)"
	];
	const baseAligns = [
		"left",
		"left",
		"right",
		"right",
		"right",
		"right",
		"right",
		"right"
	];
	const compactHeaders = [
		config.firstColumnName,
		"Models",
		"Input",
		"Output",
		"Cost (USD)"
	];
	const compactAligns = [
		"left",
		"left",
		"right",
		"right",
		"right"
	];
	if (config.includeLastActivity ?? false) {
		baseHeaders.push("Last Activity");
		baseAligns.push("left");
		compactHeaders.push("Last Activity");
		compactAligns.push("left");
	}
	return new ResponsiveTable({
		head: baseHeaders,
		style: { head: ["cyan"] },
		colAligns: baseAligns,
		dateFormatter: config.dateFormatter,
		compactHead: compactHeaders,
		compactColAligns: compactAligns,
		compactThreshold: 100,
		forceCompact: config.forceCompact
	});
}
function formatUsageDataRow(firstColumnValue, data, lastActivity) {
	const totalTokens = data.inputTokens + data.outputTokens + data.cacheCreationTokens + data.cacheReadTokens;
	const row = [
		firstColumnValue,
		data.modelsUsed != null ? formatModelsDisplayMultiline(data.modelsUsed) : "",
		formatNumber(data.inputTokens),
		formatNumber(data.outputTokens),
		formatNumber(data.cacheCreationTokens),
		formatNumber(data.cacheReadTokens),
		formatNumber(totalTokens),
		formatCurrency(data.totalCost)
	];
	if (lastActivity !== void 0) row.push(lastActivity);
	return row;
}
function formatTotalsRow(totals, includeLastActivity = false) {
	const totalTokens = totals.inputTokens + totals.outputTokens + totals.cacheCreationTokens + totals.cacheReadTokens;
	const row = [
		import_picocolors.default.yellow("Total"),
		"",
		import_picocolors.default.yellow(formatNumber(totals.inputTokens)),
		import_picocolors.default.yellow(formatNumber(totals.outputTokens)),
		import_picocolors.default.yellow(formatNumber(totals.cacheCreationTokens)),
		import_picocolors.default.yellow(formatNumber(totals.cacheReadTokens)),
		import_picocolors.default.yellow(formatNumber(totalTokens)),
		import_picocolors.default.yellow(formatCurrency(totals.totalCost))
	];
	if (includeLastActivity) row.push("");
	return row;
}
function addEmptySeparatorRow(table, columnCount) {
	const emptyRow = Array.from({ length: columnCount }, () => "");
	table.push(emptyRow);
}
function createDateFormatter(timezone, locale) {
	return new Intl.DateTimeFormat(locale, {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		timeZone: timezone
	});
}
function formatDate(dateStr, timezone, locale) {
	const date = new Date(dateStr);
	return createDateFormatter(timezone, locale ?? DEFAULT_LOCALE).format(date);
}
function sortByDate(items, getDate, order = "desc") {
	const sorted = sort(items);
	switch (order) {
		case "desc": return sorted.desc((item) => new Date(getDate(item)).getTime());
		case "asc": return sorted.asc((item) => new Date(getDate(item)).getTime());
		default: unreachable(order);
	}
}
function filterByDateRange(items, getDate, since, until) {
	if (since == null && until == null) return items;
	return items.filter((item) => {
		const dateStr = getDate(item).substring(0, 10).replace(/-/g, "");
		if (since != null && dateStr < since) return false;
		if (until != null && dateStr > until) return false;
		return true;
	});
}
function getDateWeek(date, startDay) {
	const d$1 = new Date(date);
	const shift = (d$1.getDay() - startDay + 7) % 7;
	d$1.setDate(d$1.getDate() - shift);
	return createWeeklyDate(d$1.toISOString().substring(0, 10));
}
function getDayNumber(day) {
	return {
		sunday: 0,
		monday: 1,
		tuesday: 2,
		wednesday: 3,
		thursday: 4,
		friday: 5,
		saturday: 6
	}[day];
}
const LITELLM_PRICING_URL = "https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json";
const DEFAULT_TIERED_THRESHOLD = 2e5;
const liteLLMModelPricingSchema = object({
	input_cost_per_token: optional(number()),
	output_cost_per_token: optional(number()),
	cache_creation_input_token_cost: optional(number()),
	cache_read_input_token_cost: optional(number()),
	max_tokens: optional(number()),
	max_input_tokens: optional(number()),
	max_output_tokens: optional(number()),
	input_cost_per_token_above_200k_tokens: optional(number()),
	output_cost_per_token_above_200k_tokens: optional(number()),
	cache_creation_input_token_cost_above_200k_tokens: optional(number()),
	cache_read_input_token_cost_above_200k_tokens: optional(number()),
	input_cost_per_token_above_128k_tokens: optional(number()),
	output_cost_per_token_above_128k_tokens: optional(number()),
	provider_specific_entry: optional(object({ fast: optional(number()) }))
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
			})), map$1((data) => {
				const pricing = /* @__PURE__ */ new Map();
				for (const [modelName, modelData] of Object.entries(data)) {
					if (typeof modelData !== "object" || modelData == null) continue;
					const parsed = safeParse(liteLLMModelPricingSchema, modelData);
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
		return pipe(this.ensurePricingLoaded(), map$1((pricing) => {
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
		return pipe(this.getModelPricing(modelName), map$1((pricing) => pricing?.max_input_tokens ?? null));
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
const CLAUDE_PROVIDER_PREFIXES = [
	"anthropic/",
	"claude-3-5-",
	"claude-3-",
	"claude-",
	"openrouter/openai/"
];
const PREFETCHED_CLAUDE_PRICING = {
	"anthropic.claude-3-5-haiku-20241022-v1:0": {
		"input_cost_per_token": 8e-7,
		"output_cost_per_token": 4e-6,
		"cache_creation_input_token_cost": 1e-6,
		"cache_read_input_token_cost": 8e-8,
		"max_tokens": 8192,
		"max_input_tokens": 2e5,
		"max_output_tokens": 8192
	},
	"anthropic.claude-haiku-4-5-20251001-v1:0": {
		"input_cost_per_token": 1e-6,
		"output_cost_per_token": 5e-6,
		"cache_creation_input_token_cost": 125e-8,
		"cache_read_input_token_cost": 1e-7,
		"max_tokens": 64e3,
		"max_input_tokens": 2e5,
		"max_output_tokens": 64e3
	},
	"anthropic.claude-haiku-4-5@20251001": {
		"input_cost_per_token": 1e-6,
		"output_cost_per_token": 5e-6,
		"cache_creation_input_token_cost": 125e-8,
		"cache_read_input_token_cost": 1e-7,
		"max_tokens": 64e3,
		"max_input_tokens": 2e5,
		"max_output_tokens": 64e3
	},
	"anthropic.claude-3-5-sonnet-20240620-v1:0": {
		"input_cost_per_token": 3e-6,
		"output_cost_per_token": 15e-6,
		"cache_creation_input_token_cost": 375e-8,
		"cache_read_input_token_cost": 3e-7,
		"max_tokens": 4096,
		"max_input_tokens": 1e6,
		"max_output_tokens": 4096,
		"input_cost_per_token_above_200k_tokens": 6e-6,
		"output_cost_per_token_above_200k_tokens": 3e-5,
		"cache_creation_input_token_cost_above_200k_tokens": 75e-7,
		"cache_read_input_token_cost_above_200k_tokens": 6e-7
	},
	"anthropic.claude-3-5-sonnet-20241022-v2:0": {
		"input_cost_per_token": 3e-6,
		"output_cost_per_token": 15e-6,
		"cache_creation_input_token_cost": 375e-8,
		"cache_read_input_token_cost": 3e-7,
		"max_tokens": 8192,
		"max_input_tokens": 1e6,
		"max_output_tokens": 8192,
		"input_cost_per_token_above_200k_tokens": 6e-6,
		"output_cost_per_token_above_200k_tokens": 3e-5,
		"cache_creation_input_token_cost_above_200k_tokens": 75e-7,
		"cache_read_input_token_cost_above_200k_tokens": 6e-7
	},
	"anthropic.claude-3-7-sonnet-20240620-v1:0": {
		"input_cost_per_token": 36e-7,
		"output_cost_per_token": 18e-6,
		"cache_creation_input_token_cost": 45e-7,
		"cache_read_input_token_cost": 36e-8,
		"max_tokens": 8192,
		"max_input_tokens": 2e5,
		"max_output_tokens": 8192
	},
	"anthropic.claude-3-7-sonnet-20250219-v1:0": {
		"input_cost_per_token": 3e-6,
		"output_cost_per_token": 15e-6,
		"cache_creation_input_token_cost": 375e-8,
		"cache_read_input_token_cost": 3e-7,
		"max_tokens": 8192,
		"max_input_tokens": 2e5,
		"max_output_tokens": 8192
	},
	"anthropic.claude-3-haiku-20240307-v1:0": {
		"input_cost_per_token": 25e-8,
		"output_cost_per_token": 125e-8,
		"cache_creation_input_token_cost": 3.125e-7,
		"cache_read_input_token_cost": 25e-9,
		"max_tokens": 4096,
		"max_input_tokens": 2e5,
		"max_output_tokens": 4096
	},
	"anthropic.claude-3-opus-20240229-v1:0": {
		"input_cost_per_token": 15e-6,
		"output_cost_per_token": 75e-6,
		"cache_creation_input_token_cost": 1875e-8,
		"cache_read_input_token_cost": 15e-7,
		"max_tokens": 4096,
		"max_input_tokens": 2e5,
		"max_output_tokens": 4096
	},
	"anthropic.claude-3-sonnet-20240229-v1:0": {
		"input_cost_per_token": 3e-6,
		"output_cost_per_token": 15e-6,
		"cache_creation_input_token_cost": 375e-8,
		"cache_read_input_token_cost": 3e-7,
		"max_tokens": 4096,
		"max_input_tokens": 2e5,
		"max_output_tokens": 4096
	},
	"anthropic.claude-instant-v1": {
		"input_cost_per_token": 8e-7,
		"output_cost_per_token": 24e-7,
		"max_tokens": 8191,
		"max_input_tokens": 1e5,
		"max_output_tokens": 8191
	},
	"anthropic.claude-opus-4-1-20250805-v1:0": {
		"input_cost_per_token": 15e-6,
		"output_cost_per_token": 75e-6,
		"cache_creation_input_token_cost": 1875e-8,
		"cache_read_input_token_cost": 15e-7,
		"max_tokens": 32e3,
		"max_input_tokens": 2e5,
		"max_output_tokens": 32e3
	},
	"anthropic.claude-opus-4-20250514-v1:0": {
		"input_cost_per_token": 15e-6,
		"output_cost_per_token": 75e-6,
		"cache_creation_input_token_cost": 1875e-8,
		"cache_read_input_token_cost": 15e-7,
		"max_tokens": 32e3,
		"max_input_tokens": 2e5,
		"max_output_tokens": 32e3
	},
	"anthropic.claude-opus-4-5-20251101-v1:0": {
		"input_cost_per_token": 5e-6,
		"output_cost_per_token": 25e-6,
		"cache_creation_input_token_cost": 625e-8,
		"cache_read_input_token_cost": 5e-7,
		"max_tokens": 64e3,
		"max_input_tokens": 2e5,
		"max_output_tokens": 64e3
	},
	"anthropic.claude-opus-4-6-v1": {
		"input_cost_per_token": 5e-6,
		"output_cost_per_token": 25e-6,
		"cache_creation_input_token_cost": 625e-8,
		"cache_read_input_token_cost": 5e-7,
		"max_tokens": 128e3,
		"max_input_tokens": 1e6,
		"max_output_tokens": 128e3,
		"input_cost_per_token_above_200k_tokens": 1e-5,
		"output_cost_per_token_above_200k_tokens": 375e-7,
		"cache_creation_input_token_cost_above_200k_tokens": 125e-7,
		"cache_read_input_token_cost_above_200k_tokens": 1e-6
	},
	"anthropic.claude-sonnet-4-6": {
		"input_cost_per_token": 3e-6,
		"output_cost_per_token": 15e-6,
		"cache_creation_input_token_cost": 375e-8,
		"cache_read_input_token_cost": 3e-7,
		"max_tokens": 64e3,
		"max_input_tokens": 2e5,
		"max_output_tokens": 64e3,
		"input_cost_per_token_above_200k_tokens": 6e-6,
		"output_cost_per_token_above_200k_tokens": 225e-7,
		"cache_creation_input_token_cost_above_200k_tokens": 75e-7,
		"cache_read_input_token_cost_above_200k_tokens": 6e-7
	},
	"anthropic.claude-sonnet-4-20250514-v1:0": {
		"input_cost_per_token": 3e-6,
		"output_cost_per_token": 15e-6,
		"cache_creation_input_token_cost": 375e-8,
		"cache_read_input_token_cost": 3e-7,
		"max_tokens": 64e3,
		"max_input_tokens": 1e6,
		"max_output_tokens": 64e3,
		"input_cost_per_token_above_200k_tokens": 6e-6,
		"output_cost_per_token_above_200k_tokens": 225e-7,
		"cache_creation_input_token_cost_above_200k_tokens": 75e-7,
		"cache_read_input_token_cost_above_200k_tokens": 6e-7
	},
	"anthropic.claude-sonnet-4-5-20250929-v1:0": {
		"input_cost_per_token": 3e-6,
		"output_cost_per_token": 15e-6,
		"cache_creation_input_token_cost": 375e-8,
		"cache_read_input_token_cost": 3e-7,
		"max_tokens": 64e3,
		"max_input_tokens": 2e5,
		"max_output_tokens": 64e3,
		"input_cost_per_token_above_200k_tokens": 6e-6,
		"output_cost_per_token_above_200k_tokens": 225e-7,
		"cache_creation_input_token_cost_above_200k_tokens": 75e-7,
		"cache_read_input_token_cost_above_200k_tokens": 6e-7
	},
	"anthropic.claude-v1": {
		"input_cost_per_token": 8e-6,
		"output_cost_per_token": 24e-6,
		"max_tokens": 8191,
		"max_input_tokens": 1e5,
		"max_output_tokens": 8191
	},
	"anthropic.claude-v2:1": {
		"input_cost_per_token": 8e-6,
		"output_cost_per_token": 24e-6,
		"max_tokens": 8191,
		"max_input_tokens": 1e5,
		"max_output_tokens": 8191
	},
	"claude-3-5-haiku-20241022": {
		"input_cost_per_token": 8e-7,
		"output_cost_per_token": 4e-6,
		"cache_creation_input_token_cost": 1e-6,
		"cache_read_input_token_cost": 8e-8,
		"max_tokens": 8192,
		"max_input_tokens": 2e5,
		"max_output_tokens": 8192
	},
	"claude-3-5-haiku-latest": {
		"input_cost_per_token": 1e-6,
		"output_cost_per_token": 5e-6,
		"cache_creation_input_token_cost": 125e-8,
		"cache_read_input_token_cost": 1e-7,
		"max_tokens": 8192,
		"max_input_tokens": 2e5,
		"max_output_tokens": 8192
	},
	"claude-haiku-4-5-20251001": {
		"input_cost_per_token": 1e-6,
		"output_cost_per_token": 5e-6,
		"cache_creation_input_token_cost": 125e-8,
		"cache_read_input_token_cost": 1e-7,
		"max_tokens": 64e3,
		"max_input_tokens": 2e5,
		"max_output_tokens": 64e3
	},
	"claude-haiku-4-5": {
		"input_cost_per_token": 1e-6,
		"output_cost_per_token": 5e-6,
		"cache_creation_input_token_cost": 125e-8,
		"cache_read_input_token_cost": 1e-7,
		"max_tokens": 64e3,
		"max_input_tokens": 2e5,
		"max_output_tokens": 64e3
	},
	"claude-3-5-sonnet-20240620": {
		"input_cost_per_token": 3e-6,
		"output_cost_per_token": 15e-6,
		"cache_creation_input_token_cost": 375e-8,
		"cache_read_input_token_cost": 3e-7,
		"max_tokens": 8192,
		"max_input_tokens": 2e5,
		"max_output_tokens": 8192
	},
	"claude-3-5-sonnet-20241022": {
		"input_cost_per_token": 3e-6,
		"output_cost_per_token": 15e-6,
		"cache_creation_input_token_cost": 375e-8,
		"cache_read_input_token_cost": 3e-7,
		"max_tokens": 8192,
		"max_input_tokens": 2e5,
		"max_output_tokens": 8192
	},
	"claude-3-5-sonnet-latest": {
		"input_cost_per_token": 3e-6,
		"output_cost_per_token": 15e-6,
		"cache_creation_input_token_cost": 375e-8,
		"cache_read_input_token_cost": 3e-7,
		"max_tokens": 8192,
		"max_input_tokens": 2e5,
		"max_output_tokens": 8192
	},
	"claude-3-7-sonnet-20250219": {
		"input_cost_per_token": 3e-6,
		"output_cost_per_token": 15e-6,
		"cache_creation_input_token_cost": 375e-8,
		"cache_read_input_token_cost": 3e-7,
		"max_tokens": 64e3,
		"max_input_tokens": 2e5,
		"max_output_tokens": 64e3
	},
	"claude-3-7-sonnet-latest": {
		"input_cost_per_token": 3e-6,
		"output_cost_per_token": 15e-6,
		"cache_creation_input_token_cost": 375e-8,
		"cache_read_input_token_cost": 3e-7,
		"max_tokens": 64e3,
		"max_input_tokens": 2e5,
		"max_output_tokens": 64e3
	},
	"claude-3-haiku-20240307": {
		"input_cost_per_token": 25e-8,
		"output_cost_per_token": 125e-8,
		"cache_creation_input_token_cost": 3e-7,
		"cache_read_input_token_cost": 3e-8,
		"max_tokens": 4096,
		"max_input_tokens": 2e5,
		"max_output_tokens": 4096
	},
	"claude-3-opus-20240229": {
		"input_cost_per_token": 15e-6,
		"output_cost_per_token": 75e-6,
		"cache_creation_input_token_cost": 1875e-8,
		"cache_read_input_token_cost": 15e-7,
		"max_tokens": 4096,
		"max_input_tokens": 2e5,
		"max_output_tokens": 4096
	},
	"claude-3-opus-latest": {
		"input_cost_per_token": 15e-6,
		"output_cost_per_token": 75e-6,
		"cache_creation_input_token_cost": 1875e-8,
		"cache_read_input_token_cost": 15e-7,
		"max_tokens": 4096,
		"max_input_tokens": 2e5,
		"max_output_tokens": 4096
	},
	"claude-4-opus-20250514": {
		"input_cost_per_token": 15e-6,
		"output_cost_per_token": 75e-6,
		"cache_creation_input_token_cost": 1875e-8,
		"cache_read_input_token_cost": 15e-7,
		"max_tokens": 32e3,
		"max_input_tokens": 2e5,
		"max_output_tokens": 32e3
	},
	"claude-4-sonnet-20250514": {
		"input_cost_per_token": 3e-6,
		"output_cost_per_token": 15e-6,
		"cache_creation_input_token_cost": 375e-8,
		"cache_read_input_token_cost": 3e-7,
		"max_tokens": 64e3,
		"max_input_tokens": 1e6,
		"max_output_tokens": 64e3,
		"input_cost_per_token_above_200k_tokens": 6e-6,
		"output_cost_per_token_above_200k_tokens": 225e-7,
		"cache_creation_input_token_cost_above_200k_tokens": 75e-7,
		"cache_read_input_token_cost_above_200k_tokens": 6e-7
	},
	"claude-sonnet-4-5": {
		"input_cost_per_token": 3e-6,
		"output_cost_per_token": 15e-6,
		"cache_creation_input_token_cost": 375e-8,
		"cache_read_input_token_cost": 3e-7,
		"max_tokens": 64e3,
		"max_input_tokens": 2e5,
		"max_output_tokens": 64e3,
		"input_cost_per_token_above_200k_tokens": 6e-6,
		"output_cost_per_token_above_200k_tokens": 225e-7,
		"cache_creation_input_token_cost_above_200k_tokens": 75e-7,
		"cache_read_input_token_cost_above_200k_tokens": 6e-7
	},
	"claude-sonnet-4-5-20250929": {
		"input_cost_per_token": 3e-6,
		"output_cost_per_token": 15e-6,
		"cache_creation_input_token_cost": 375e-8,
		"cache_read_input_token_cost": 3e-7,
		"max_tokens": 64e3,
		"max_input_tokens": 2e5,
		"max_output_tokens": 64e3,
		"input_cost_per_token_above_200k_tokens": 6e-6,
		"output_cost_per_token_above_200k_tokens": 225e-7,
		"cache_creation_input_token_cost_above_200k_tokens": 75e-7,
		"cache_read_input_token_cost_above_200k_tokens": 6e-7
	},
	"claude-sonnet-4-6": {
		"input_cost_per_token": 3e-6,
		"output_cost_per_token": 15e-6,
		"cache_creation_input_token_cost": 375e-8,
		"cache_read_input_token_cost": 3e-7,
		"max_tokens": 64e3,
		"max_input_tokens": 2e5,
		"max_output_tokens": 64e3,
		"input_cost_per_token_above_200k_tokens": 6e-6,
		"output_cost_per_token_above_200k_tokens": 225e-7,
		"cache_creation_input_token_cost_above_200k_tokens": 75e-7,
		"cache_read_input_token_cost_above_200k_tokens": 6e-7
	},
	"claude-sonnet-4-5-20250929-v1:0": {
		"input_cost_per_token": 3e-6,
		"output_cost_per_token": 15e-6,
		"cache_creation_input_token_cost": 375e-8,
		"cache_read_input_token_cost": 3e-7,
		"max_tokens": 64e3,
		"max_input_tokens": 2e5,
		"max_output_tokens": 64e3,
		"input_cost_per_token_above_200k_tokens": 6e-6,
		"output_cost_per_token_above_200k_tokens": 225e-7,
		"cache_creation_input_token_cost_above_200k_tokens": 75e-7,
		"cache_read_input_token_cost_above_200k_tokens": 6e-7
	},
	"claude-opus-4-1": {
		"input_cost_per_token": 15e-6,
		"output_cost_per_token": 75e-6,
		"cache_creation_input_token_cost": 1875e-8,
		"cache_read_input_token_cost": 15e-7,
		"max_tokens": 32e3,
		"max_input_tokens": 2e5,
		"max_output_tokens": 32e3
	},
	"claude-opus-4-1-20250805": {
		"input_cost_per_token": 15e-6,
		"output_cost_per_token": 75e-6,
		"cache_creation_input_token_cost": 1875e-8,
		"cache_read_input_token_cost": 15e-7,
		"max_tokens": 32e3,
		"max_input_tokens": 2e5,
		"max_output_tokens": 32e3
	},
	"claude-opus-4-20250514": {
		"input_cost_per_token": 15e-6,
		"output_cost_per_token": 75e-6,
		"cache_creation_input_token_cost": 1875e-8,
		"cache_read_input_token_cost": 15e-7,
		"max_tokens": 32e3,
		"max_input_tokens": 2e5,
		"max_output_tokens": 32e3
	},
	"claude-opus-4-5-20251101": {
		"input_cost_per_token": 5e-6,
		"output_cost_per_token": 25e-6,
		"cache_creation_input_token_cost": 625e-8,
		"cache_read_input_token_cost": 5e-7,
		"max_tokens": 64e3,
		"max_input_tokens": 2e5,
		"max_output_tokens": 64e3
	},
	"claude-opus-4-5": {
		"input_cost_per_token": 5e-6,
		"output_cost_per_token": 25e-6,
		"cache_creation_input_token_cost": 625e-8,
		"cache_read_input_token_cost": 5e-7,
		"max_tokens": 64e3,
		"max_input_tokens": 2e5,
		"max_output_tokens": 64e3
	},
	"claude-opus-4-6": {
		"input_cost_per_token": 5e-6,
		"output_cost_per_token": 25e-6,
		"cache_creation_input_token_cost": 625e-8,
		"cache_read_input_token_cost": 5e-7,
		"max_tokens": 128e3,
		"max_input_tokens": 1e6,
		"max_output_tokens": 128e3,
		"input_cost_per_token_above_200k_tokens": 1e-5,
		"output_cost_per_token_above_200k_tokens": 375e-7,
		"cache_creation_input_token_cost_above_200k_tokens": 125e-7,
		"cache_read_input_token_cost_above_200k_tokens": 1e-6,
		"provider_specific_entry": { "fast": 6 }
	},
	"claude-opus-4-6-20260205": {
		"input_cost_per_token": 5e-6,
		"output_cost_per_token": 25e-6,
		"cache_creation_input_token_cost": 625e-8,
		"cache_read_input_token_cost": 5e-7,
		"max_tokens": 128e3,
		"max_input_tokens": 1e6,
		"max_output_tokens": 128e3,
		"input_cost_per_token_above_200k_tokens": 1e-5,
		"output_cost_per_token_above_200k_tokens": 375e-7,
		"cache_creation_input_token_cost_above_200k_tokens": 125e-7,
		"cache_read_input_token_cost_above_200k_tokens": 1e-6,
		"provider_specific_entry": { "fast": 6 }
	},
	"claude-sonnet-4-20250514": {
		"input_cost_per_token": 3e-6,
		"output_cost_per_token": 15e-6,
		"cache_creation_input_token_cost": 375e-8,
		"cache_read_input_token_cost": 3e-7,
		"max_tokens": 64e3,
		"max_input_tokens": 1e6,
		"max_output_tokens": 64e3,
		"input_cost_per_token_above_200k_tokens": 6e-6,
		"output_cost_per_token_above_200k_tokens": 225e-7,
		"cache_creation_input_token_cost_above_200k_tokens": 75e-7,
		"cache_read_input_token_cost_above_200k_tokens": 6e-7
	}
};
var PricingFetcher = class extends LiteLLMPricingFetcher {
	constructor(offline = false) {
		super({
			offline,
			offlineLoader: async () => PREFETCHED_CLAUDE_PRICING,
			logger,
			providerPrefixes: CLAUDE_PROVIDER_PREFIXES
		});
	}
};
const DEFAULT_SESSION_DURATION_HOURS = 5;
function floorToHour(timestamp) {
	const floored = new Date(timestamp);
	floored.setUTCMinutes(0, 0, 0);
	return floored;
}
function identifySessionBlocks(entries, sessionDurationHours = DEFAULT_SESSION_DURATION_HOURS) {
	if (entries.length === 0) return [];
	const sessionDurationMs = sessionDurationHours * 60 * 60 * 1e3;
	const blocks = [];
	const sortedEntries = [...entries].sort((a$1, b$1) => a$1.timestamp.getTime() - b$1.timestamp.getTime());
	let currentBlockStart = null;
	let currentBlockEntries = [];
	const now = /* @__PURE__ */ new Date();
	for (const entry of sortedEntries) {
		const entryTime = entry.timestamp;
		if (currentBlockStart == null) {
			currentBlockStart = floorToHour(entryTime);
			currentBlockEntries = [entry];
		} else {
			const timeSinceBlockStart = entryTime.getTime() - currentBlockStart.getTime();
			const lastEntry = currentBlockEntries.at(-1);
			if (lastEntry == null) continue;
			const lastEntryTime = lastEntry.timestamp;
			const timeSinceLastEntry = entryTime.getTime() - lastEntryTime.getTime();
			if (timeSinceBlockStart > sessionDurationMs || timeSinceLastEntry > sessionDurationMs) {
				const block = createBlock(currentBlockStart, currentBlockEntries, now, sessionDurationMs);
				blocks.push(block);
				if (timeSinceLastEntry > sessionDurationMs) {
					const gapBlock = createGapBlock(lastEntryTime, entryTime, sessionDurationMs);
					if (gapBlock != null) blocks.push(gapBlock);
				}
				currentBlockStart = floorToHour(entryTime);
				currentBlockEntries = [entry];
			} else currentBlockEntries.push(entry);
		}
	}
	if (currentBlockStart != null && currentBlockEntries.length > 0) {
		const block = createBlock(currentBlockStart, currentBlockEntries, now, sessionDurationMs);
		blocks.push(block);
	}
	return blocks;
}
function createBlock(startTime, entries, now, sessionDurationMs) {
	const endTime = new Date(startTime.getTime() + sessionDurationMs);
	const lastEntry = entries[entries.length - 1];
	const actualEndTime = lastEntry != null ? lastEntry.timestamp : startTime;
	const isActive = now.getTime() - actualEndTime.getTime() < sessionDurationMs && now < endTime;
	const tokenCounts = {
		inputTokens: 0,
		outputTokens: 0,
		cacheCreationInputTokens: 0,
		cacheReadInputTokens: 0
	};
	let costUSD = 0;
	const models = [];
	let usageLimitResetTime;
	for (const entry of entries) {
		tokenCounts.inputTokens += entry.usage.inputTokens;
		tokenCounts.outputTokens += entry.usage.outputTokens;
		tokenCounts.cacheCreationInputTokens += entry.usage.cacheCreationInputTokens;
		tokenCounts.cacheReadInputTokens += entry.usage.cacheReadInputTokens;
		costUSD += entry.costUSD ?? 0;
		usageLimitResetTime = entry.usageLimitResetTime ?? usageLimitResetTime;
		models.push(entry.model);
	}
	return {
		id: startTime.toISOString(),
		startTime,
		endTime,
		actualEndTime,
		isActive,
		entries,
		tokenCounts,
		costUSD,
		models: uniq(models),
		usageLimitResetTime
	};
}
function createGapBlock(lastActivityTime, nextActivityTime, sessionDurationMs) {
	if (nextActivityTime.getTime() - lastActivityTime.getTime() <= sessionDurationMs) return null;
	const gapStart = new Date(lastActivityTime.getTime() + sessionDurationMs);
	const gapEnd = nextActivityTime;
	return {
		id: `gap-${gapStart.toISOString()}`,
		startTime: gapStart,
		endTime: gapEnd,
		isActive: false,
		isGap: true,
		entries: [],
		tokenCounts: {
			inputTokens: 0,
			outputTokens: 0,
			cacheCreationInputTokens: 0,
			cacheReadInputTokens: 0
		},
		costUSD: 0,
		models: []
	};
}
function calculateBurnRate(block) {
	if (block.entries.length === 0 || (block.isGap ?? false)) return null;
	const firstEntryData = block.entries[0];
	const lastEntryData = block.entries[block.entries.length - 1];
	if (firstEntryData == null || lastEntryData == null) return null;
	const firstEntry = firstEntryData.timestamp;
	const durationMinutes = (lastEntryData.timestamp.getTime() - firstEntry.getTime()) / (1e3 * 60);
	if (durationMinutes <= 0) return null;
	return {
		tokensPerMinute: getTotalTokens(block.tokenCounts) / durationMinutes,
		tokensPerMinuteForIndicator: ((block.tokenCounts.inputTokens ?? 0) + (block.tokenCounts.outputTokens ?? 0)) / durationMinutes,
		costPerHour: block.costUSD / durationMinutes * 60
	};
}
function projectBlockUsage(block) {
	if (!block.isActive || (block.isGap ?? false)) return null;
	const burnRate = calculateBurnRate(block);
	if (burnRate == null) return null;
	const now = /* @__PURE__ */ new Date();
	const remainingTime = block.endTime.getTime() - now.getTime();
	const remainingMinutes = Math.max(0, remainingTime / (1e3 * 60));
	const totalTokens = getTotalTokens(block.tokenCounts) + burnRate.tokensPerMinute * remainingMinutes;
	const projectedAdditionalCost = burnRate.costPerHour / 60 * remainingMinutes;
	const totalCost = block.costUSD + projectedAdditionalCost;
	return {
		totalTokens: Math.round(totalTokens),
		totalCost: Math.round(totalCost * 100) / 100,
		remainingMinutes: Math.round(remainingMinutes)
	};
}
function filterRecentBlocks(blocks, days = DEFAULT_RECENT_DAYS) {
	const now = /* @__PURE__ */ new Date();
	const cutoffTime = /* @__PURE__ */ new Date(now.getTime() - days * 24 * 60 * 60 * 1e3);
	return blocks.filter((block) => {
		return block.startTime >= cutoffTime || block.isActive;
	});
}
function getClaudePaths() {
	const paths = [];
	const normalizedPaths = /* @__PURE__ */ new Set();
	const envPaths = (process$1.env[CLAUDE_CONFIG_DIR_ENV] ?? "").trim();
	if (envPaths !== "") {
		const envPathList = envPaths.split(",").map((p$1) => p$1.trim()).filter((p$1) => p$1 !== "");
		for (const envPath of envPathList) {
			const normalizedPath = path.resolve(envPath);
			if (isDirectorySync(normalizedPath)) {
				if (isDirectorySync(path.join(normalizedPath, CLAUDE_PROJECTS_DIR_NAME))) {
					if (!normalizedPaths.has(normalizedPath)) {
						normalizedPaths.add(normalizedPath);
						paths.push(normalizedPath);
					}
				}
			}
		}
		if (paths.length > 0) return paths;
		throw new Error(`No valid Claude data directories found in CLAUDE_CONFIG_DIR. Please ensure the following exists:
- ${envPaths}/${CLAUDE_PROJECTS_DIR_NAME}`.trim());
	}
	const defaultPaths = [DEFAULT_CLAUDE_CONFIG_PATH, path.join(USER_HOME_DIR, DEFAULT_CLAUDE_CODE_PATH)];
	for (const defaultPath of defaultPaths) {
		const normalizedPath = path.resolve(defaultPath);
		if (isDirectorySync(normalizedPath)) {
			if (isDirectorySync(path.join(normalizedPath, CLAUDE_PROJECTS_DIR_NAME))) {
				if (!normalizedPaths.has(normalizedPath)) {
					normalizedPaths.add(normalizedPath);
					paths.push(normalizedPath);
				}
			}
		}
	}
	if (paths.length === 0) throw new Error(`No valid Claude data directories found. Please ensure at least one of the following exists:
- ${path.join(DEFAULT_CLAUDE_CONFIG_PATH, CLAUDE_PROJECTS_DIR_NAME)}
- ${path.join(USER_HOME_DIR, DEFAULT_CLAUDE_CODE_PATH, CLAUDE_PROJECTS_DIR_NAME)}
- Or set ${CLAUDE_CONFIG_DIR_ENV} environment variable to valid directory path(s) containing a '${CLAUDE_PROJECTS_DIR_NAME}' subdirectory`.trim());
	return paths;
}
function extractProjectFromPath(jsonlPath) {
	const segments = jsonlPath.replace(/[/\\]/g, path.sep).split(path.sep);
	const projectsIndex = segments.findIndex((segment) => segment === CLAUDE_PROJECTS_DIR_NAME);
	if (projectsIndex === -1 || projectsIndex + 1 >= segments.length) return "unknown";
	const projectName = segments[projectsIndex + 1];
	return projectName != null && projectName.trim() !== "" ? projectName : "unknown";
}
const usageDataSchema = object({
	cwd: optional(string()),
	sessionId: optional(sessionIdSchema),
	timestamp: isoTimestampSchema,
	version: optional(versionSchema),
	message: object({
		usage: object({
			input_tokens: number(),
			output_tokens: number(),
			cache_creation_input_tokens: optional(number()),
			cache_read_input_tokens: optional(number()),
			speed: optional(picklist(["standard", "fast"]))
		}),
		model: optional(modelNameSchema),
		id: optional(messageIdSchema),
		content: optional(array(object({ text: optional(string()) })))
	}),
	costUSD: optional(number()),
	requestId: optional(requestIdSchema),
	isApiErrorMessage: optional(boolean())
});
const transcriptUsageSchema = object({
	input_tokens: optional(number()),
	cache_creation_input_tokens: optional(number()),
	cache_read_input_tokens: optional(number()),
	output_tokens: optional(number())
});
const transcriptMessageSchema = object({
	type: optional(string()),
	message: optional(object({ usage: optional(transcriptUsageSchema) }))
});
const modelBreakdownSchema = object({
	modelName: modelNameSchema,
	inputTokens: number(),
	outputTokens: number(),
	cacheCreationTokens: number(),
	cacheReadTokens: number(),
	cost: number()
});
const dailyUsageSchema = object({
	date: dailyDateSchema,
	inputTokens: number(),
	outputTokens: number(),
	cacheCreationTokens: number(),
	cacheReadTokens: number(),
	totalCost: number(),
	modelsUsed: array(modelNameSchema),
	modelBreakdowns: array(modelBreakdownSchema),
	project: optional(string())
});
const sessionUsageSchema = object({
	sessionId: sessionIdSchema,
	projectPath: projectPathSchema,
	inputTokens: number(),
	outputTokens: number(),
	cacheCreationTokens: number(),
	cacheReadTokens: number(),
	totalCost: number(),
	lastActivity: activityDateSchema,
	versions: array(versionSchema),
	modelsUsed: array(modelNameSchema),
	modelBreakdowns: array(modelBreakdownSchema)
});
const monthlyUsageSchema = object({
	month: monthlyDateSchema,
	inputTokens: number(),
	outputTokens: number(),
	cacheCreationTokens: number(),
	cacheReadTokens: number(),
	totalCost: number(),
	modelsUsed: array(modelNameSchema),
	modelBreakdowns: array(modelBreakdownSchema),
	project: optional(string())
});
const weeklyUsageSchema = object({
	week: weeklyDateSchema,
	inputTokens: number(),
	outputTokens: number(),
	cacheCreationTokens: number(),
	cacheReadTokens: number(),
	totalCost: number(),
	modelsUsed: array(modelNameSchema),
	modelBreakdowns: array(modelBreakdownSchema),
	project: optional(string())
});
const bucketUsageSchema = object({
	bucket: union([weeklyDateSchema, monthlyDateSchema]),
	inputTokens: number(),
	outputTokens: number(),
	cacheCreationTokens: number(),
	cacheReadTokens: number(),
	totalCost: number(),
	modelsUsed: array(modelNameSchema),
	modelBreakdowns: array(modelBreakdownSchema),
	project: optional(string())
});
function getDisplayModelName(data) {
	const model = data.message.model;
	if (model == null) return;
	return data.message.usage.speed === "fast" ? `${model}-fast` : model;
}
function aggregateByModel(entries, getModel, getUsage, getCost) {
	const modelAggregates = /* @__PURE__ */ new Map();
	const defaultStats = {
		inputTokens: 0,
		outputTokens: 0,
		cacheCreationTokens: 0,
		cacheReadTokens: 0,
		cost: 0
	};
	for (const entry of entries) {
		const modelName = getModel(entry) ?? "unknown";
		if (modelName === "<synthetic>") continue;
		const usage = getUsage(entry);
		const cost = getCost(entry);
		const existing = modelAggregates.get(modelName) ?? defaultStats;
		modelAggregates.set(modelName, {
			inputTokens: existing.inputTokens + (usage.input_tokens ?? 0),
			outputTokens: existing.outputTokens + (usage.output_tokens ?? 0),
			cacheCreationTokens: existing.cacheCreationTokens + (usage.cache_creation_input_tokens ?? 0),
			cacheReadTokens: existing.cacheReadTokens + (usage.cache_read_input_tokens ?? 0),
			cost: existing.cost + cost
		});
	}
	return modelAggregates;
}
function aggregateModelBreakdowns(breakdowns) {
	const modelAggregates = /* @__PURE__ */ new Map();
	const defaultStats = {
		inputTokens: 0,
		outputTokens: 0,
		cacheCreationTokens: 0,
		cacheReadTokens: 0,
		cost: 0
	};
	for (const breakdown of breakdowns) {
		if (breakdown.modelName === "<synthetic>") continue;
		const existing = modelAggregates.get(breakdown.modelName) ?? defaultStats;
		modelAggregates.set(breakdown.modelName, {
			inputTokens: existing.inputTokens + breakdown.inputTokens,
			outputTokens: existing.outputTokens + breakdown.outputTokens,
			cacheCreationTokens: existing.cacheCreationTokens + breakdown.cacheCreationTokens,
			cacheReadTokens: existing.cacheReadTokens + breakdown.cacheReadTokens,
			cost: existing.cost + breakdown.cost
		});
	}
	return modelAggregates;
}
function createModelBreakdowns(modelAggregates) {
	return Array.from(modelAggregates.entries()).map(([modelName, stats]) => ({
		modelName,
		...stats
	})).sort((a$1, b$1) => b$1.cost - a$1.cost);
}
function calculateTotals(entries, getUsage, getCost) {
	return entries.reduce((acc, entry) => {
		const usage = getUsage(entry);
		const cost = getCost(entry);
		return {
			inputTokens: acc.inputTokens + (usage.input_tokens ?? 0),
			outputTokens: acc.outputTokens + (usage.output_tokens ?? 0),
			cacheCreationTokens: acc.cacheCreationTokens + (usage.cache_creation_input_tokens ?? 0),
			cacheReadTokens: acc.cacheReadTokens + (usage.cache_read_input_tokens ?? 0),
			cost: acc.cost + cost,
			totalCost: acc.totalCost + cost
		};
	}, {
		inputTokens: 0,
		outputTokens: 0,
		cacheCreationTokens: 0,
		cacheReadTokens: 0,
		cost: 0,
		totalCost: 0
	});
}
function filterByProject(items, getProject, projectFilter) {
	if (projectFilter == null) return items;
	return items.filter((item) => {
		return getProject(item) === projectFilter;
	});
}
function isDuplicateEntry(uniqueHash, processedHashes) {
	if (uniqueHash == null) return false;
	return processedHashes.has(uniqueHash);
}
function markAsProcessed(uniqueHash, processedHashes) {
	if (uniqueHash != null) processedHashes.add(uniqueHash);
}
function extractUniqueModels(entries, getModel) {
	return uniq(entries.map(getModel).filter((m$1) => m$1 != null && m$1 !== "<synthetic>"));
}
function createUniqueHash(data) {
	const messageId = data.message.id;
	const requestId = data.requestId;
	if (messageId == null || requestId == null) return null;
	return `${messageId}:${requestId}`;
}
async function processJSONLFileByLine(filePath, processLine) {
	const rl = createInterface({
		input: createReadStream(filePath, { encoding: "utf-8" }),
		crlfDelay: Number.POSITIVE_INFINITY
	});
	let lineNumber = 0;
	for await (const line of rl) {
		lineNumber++;
		if (line.trim().length === 0) continue;
		await processLine(line, lineNumber);
	}
}
async function getEarliestTimestamp(filePath) {
	try {
		let earliestDate = null;
		await processJSONLFileByLine(filePath, (line) => {
			try {
				const json = JSON.parse(line);
				if (json.timestamp != null && typeof json.timestamp === "string") {
					const date = new Date(json.timestamp);
					if (!Number.isNaN(date.getTime())) {
						if (earliestDate == null || date < earliestDate) earliestDate = date;
					}
				}
			} catch {}
		});
		return earliestDate;
	} catch (error) {
		logger.debug(`Failed to get earliest timestamp for ${filePath}:`, error);
		return null;
	}
}
async function sortFilesByTimestamp(files) {
	return (await Promise.all(files.map(async (file) => ({
		file,
		timestamp: await getEarliestTimestamp(file)
	})))).sort((a$1, b$1) => {
		if (a$1.timestamp == null && b$1.timestamp == null) return 0;
		if (a$1.timestamp == null) return 1;
		if (b$1.timestamp == null) return -1;
		return a$1.timestamp.getTime() - b$1.timestamp.getTime();
	}).map((item) => item.file);
}
async function calculateCostForEntry(data, mode, fetcher) {
	const speed = data.message.usage.speed;
	if (mode === "display") return data.costUSD ?? 0;
	if (mode === "calculate") {
		if (data.message.model != null) return unwrap(fetcher.calculateCostFromTokens(data.message.usage, data.message.model, { speed }), 0);
		return 0;
	}
	if (mode === "auto") {
		if (data.costUSD != null) return data.costUSD;
		if (data.message.model != null) return unwrap(fetcher.calculateCostFromTokens(data.message.usage, data.message.model, { speed }), 0);
		return 0;
	}
	unreachable(mode);
}
function getUsageLimitResetTime(data) {
	let resetTime = null;
	if (data.isApiErrorMessage === true) {
		const timestampMatch = data.message?.content?.find((c) => c.text != null && c.text.includes("Claude AI usage limit reached"))?.text?.match(/\|(\d+)/) ?? null;
		if (timestampMatch?.[1] != null) {
			const resetTimestamp = Number.parseInt(timestampMatch[1]);
			resetTime = resetTimestamp > 0 ? /* @__PURE__ */ new Date(resetTimestamp * 1e3) : null;
		}
	}
	return resetTime;
}
async function globUsageFiles(claudePaths) {
	const filePromises = claudePaths.map(async (claudePath) => {
		const claudeDir = path.join(claudePath, CLAUDE_PROJECTS_DIR_NAME);
		return (await glob([USAGE_DATA_GLOB_PATTERN], {
			cwd: claudeDir,
			absolute: true
		}).catch(() => [])).map((file) => ({
			file,
			baseDir: claudeDir
		}));
	});
	return (await Promise.all(filePromises)).flat();
}
async function loadDailyUsageData(options) {
	try {
		var _usingCtx$1 = _usingCtx();
		const fileList = (await globUsageFiles(toArray(options?.claudePath ?? getClaudePaths()))).map((f$2) => f$2.file);
		if (fileList.length === 0) return [];
		const sortedFiles = await sortFilesByTimestamp(filterByProject(fileList, (filePath) => extractProjectFromPath(filePath), options?.project));
		const mode = options?.mode ?? "auto";
		const fetcher = _usingCtx$1.u(mode === "display" ? null : new PricingFetcher(options?.offline));
		const processedHashes = /* @__PURE__ */ new Set();
		const allEntries = [];
		for (const file of sortedFiles) {
			const project = extractProjectFromPath(file);
			await processJSONLFileByLine(file, async (line) => {
				try {
					const result = safeParse(usageDataSchema, JSON.parse(line));
					if (!result.success) return;
					const data = result.output;
					const uniqueHash = createUniqueHash(data);
					if (isDuplicateEntry(uniqueHash, processedHashes)) return;
					markAsProcessed(uniqueHash, processedHashes);
					const date = formatDate(data.timestamp, options?.timezone, DEFAULT_LOCALE);
					const cost = fetcher != null ? await calculateCostForEntry(data, mode, fetcher) : data.costUSD ?? 0;
					allEntries.push({
						data,
						date,
						cost,
						model: getDisplayModelName(data),
						project
					});
				} catch {}
			});
		}
		const groupedData = groupBy(allEntries, options?.groupByProject === true || options?.project != null ? (entry) => `${entry.date}\x00${entry.project}` : (entry) => entry.date);
		return sortByDate(filterByProject(filterByDateRange(Object.entries(groupedData).map(([groupKey, entries]) => {
			if (entries == null) return;
			const parts = groupKey.split("\0");
			const date = parts[0] ?? groupKey;
			const project = parts.length > 1 ? parts[1] : void 0;
			const modelBreakdowns = createModelBreakdowns(aggregateByModel(entries, (entry) => entry.model, (entry) => entry.data.message.usage, (entry) => entry.cost));
			const totals = calculateTotals(entries, (entry) => entry.data.message.usage, (entry) => entry.cost);
			const modelsUsed = extractUniqueModels(entries, (e) => e.model);
			return {
				date: createDailyDate(date),
				...totals,
				modelsUsed,
				modelBreakdowns,
				...project != null && { project }
			};
		}).filter((item) => item != null), (item) => item.date, options?.since, options?.until), (item) => item.project, options?.project), (item) => item.date, options?.order);
	} catch (_) {
		_usingCtx$1.e = _;
	} finally {
		_usingCtx$1.d();
	}
}
async function loadSessionData(options) {
	try {
		var _usingCtx3 = _usingCtx();
		const filesWithBase = await globUsageFiles(toArray(options?.claudePath ?? getClaudePaths()));
		if (filesWithBase.length === 0) return [];
		const projectFilteredWithBase = filterByProject(filesWithBase, (item) => extractProjectFromPath(item.file), options?.project);
		const fileToBaseMap = new Map(projectFilteredWithBase.map((f$2) => [f$2.file, f$2.baseDir]));
		const sortedFilesWithBase = await sortFilesByTimestamp(projectFilteredWithBase.map((f$2) => f$2.file)).then((sortedFiles) => sortedFiles.map((file) => ({
			file,
			baseDir: fileToBaseMap.get(file) ?? ""
		})));
		const mode = options?.mode ?? "auto";
		const fetcher = _usingCtx3.u(mode === "display" ? null : new PricingFetcher(options?.offline));
		const processedHashes = /* @__PURE__ */ new Set();
		const allEntries = [];
		for (const { file, baseDir } of sortedFilesWithBase) {
			const parts = path.relative(baseDir, file).split(path.sep);
			const sessionId = parts[parts.length - 2] ?? "unknown";
			const joinedPath = parts.slice(0, -2).join(path.sep);
			const projectPath = joinedPath.length > 0 ? joinedPath : "Unknown Project";
			await processJSONLFileByLine(file, async (line) => {
				try {
					const result = safeParse(usageDataSchema, JSON.parse(line));
					if (!result.success) return;
					const data = result.output;
					const uniqueHash = createUniqueHash(data);
					if (isDuplicateEntry(uniqueHash, processedHashes)) return;
					markAsProcessed(uniqueHash, processedHashes);
					const sessionKey = `${projectPath}/${sessionId}`;
					const cost = fetcher != null ? await calculateCostForEntry(data, mode, fetcher) : data.costUSD ?? 0;
					allEntries.push({
						data,
						sessionKey,
						sessionId,
						projectPath,
						cost,
						timestamp: data.timestamp,
						model: getDisplayModelName(data)
					});
				} catch {}
			});
		}
		const groupedBySessions = groupBy(allEntries, (entry) => entry.sessionKey);
		return sortByDate(filterByProject(filterByDateRange(Object.entries(groupedBySessions).map(([_, entries]) => {
			if (entries == null) return;
			const latestEntry = entries.reduce((latest, current) => current.timestamp > latest.timestamp ? current : latest);
			const versions = [];
			for (const entry of entries) if (entry.data.version != null) versions.push(entry.data.version);
			const modelBreakdowns = createModelBreakdowns(aggregateByModel(entries, (entry) => entry.model, (entry) => entry.data.message.usage, (entry) => entry.cost));
			const totals = calculateTotals(entries, (entry) => entry.data.message.usage, (entry) => entry.cost);
			const modelsUsed = extractUniqueModels(entries, (e) => e.model);
			return {
				sessionId: createSessionId(latestEntry.sessionId),
				projectPath: createProjectPath(latestEntry.projectPath),
				...totals,
				lastActivity: formatDate(latestEntry.timestamp, options?.timezone, DEFAULT_LOCALE),
				versions: uniq(versions).sort(),
				modelsUsed,
				modelBreakdowns
			};
		}).filter((item) => item != null), (item) => item.lastActivity, options?.since, options?.until), (item) => item.projectPath, options?.project), (item) => item.lastActivity, options?.order);
	} catch (_) {
		_usingCtx3.e = _;
	} finally {
		_usingCtx3.d();
	}
}
async function loadMonthlyUsageData(options) {
	return loadBucketUsageData((data) => createMonthlyDate(data.date.slice(0, 7)), options).then((usages) => usages.map(({ bucket, ...rest }) => ({
		month: parse$2(monthlyDateSchema, bucket),
		...rest
	})));
}
async function loadWeeklyUsageData(options) {
	const startDay = options?.startOfWeek != null ? getDayNumber(options.startOfWeek) : getDayNumber("sunday");
	return loadBucketUsageData((data) => getDateWeek(new Date(data.date), startDay), options).then((usages) => usages.map(({ bucket, ...rest }) => ({
		week: parse$2(weeklyDateSchema, bucket),
		...rest
	})));
}
async function loadSessionUsageById(sessionId, options) {
	try {
		var _usingCtx4 = _usingCtx();
		const jsonlFiles = await glob(getClaudePaths().map((p$1) => path.join(p$1, "projects", "**", `${sessionId}.jsonl`).replace(/\\/g, "/")));
		if (jsonlFiles.length === 0) return null;
		const file = jsonlFiles[0];
		if (file == null) return null;
		const mode = options?.mode ?? "auto";
		const fetcher = _usingCtx4.u(mode === "display" ? null : new PricingFetcher(options?.offline));
		const entries = [];
		let totalCost = 0;
		await processJSONLFileByLine(file, async (line) => {
			try {
				const result = safeParse(usageDataSchema, JSON.parse(line));
				if (!result.success) return;
				const data = result.output;
				const cost = fetcher != null ? await calculateCostForEntry(data, mode, fetcher) : data.costUSD ?? 0;
				totalCost += cost;
				entries.push(data);
			} catch {}
		});
		return {
			totalCost,
			entries
		};
	} catch (_) {
		_usingCtx4.e = _;
	} finally {
		_usingCtx4.d();
	}
}
async function loadBucketUsageData(groupingFn, options) {
	const grouped = groupBy(await loadDailyUsageData(options), options?.groupByProject === true || options?.project != null ? (data) => {
		return `${groupingFn(data)}\x00${data.project ?? "unknown"}`;
	} : (data) => `${groupingFn(data)}`);
	const buckets = [];
	for (const [groupKey, dailyEntries] of Object.entries(grouped)) {
		if (dailyEntries == null) continue;
		const parts = groupKey.split("\0");
		const bucket = createBucket(parts[0] ?? groupKey);
		const project = parts.length > 1 ? parts[1] : void 0;
		const modelBreakdowns = createModelBreakdowns(aggregateModelBreakdowns(dailyEntries.flatMap((daily) => daily.modelBreakdowns)));
		const models = [];
		for (const data of dailyEntries) for (const model of data.modelsUsed) if (model !== "<synthetic>") models.push(model);
		let totalInputTokens = 0;
		let totalOutputTokens = 0;
		let totalCacheCreationTokens = 0;
		let totalCacheReadTokens = 0;
		let totalCost = 0;
		for (const daily of dailyEntries) {
			totalInputTokens += daily.inputTokens;
			totalOutputTokens += daily.outputTokens;
			totalCacheCreationTokens += daily.cacheCreationTokens;
			totalCacheReadTokens += daily.cacheReadTokens;
			totalCost += daily.totalCost;
		}
		const bucketUsage = {
			bucket,
			inputTokens: totalInputTokens,
			outputTokens: totalOutputTokens,
			cacheCreationTokens: totalCacheCreationTokens,
			cacheReadTokens: totalCacheReadTokens,
			totalCost,
			modelsUsed: uniq(models),
			modelBreakdowns,
			...project != null && { project }
		};
		buckets.push(bucketUsage);
	}
	return sortByDate(buckets, (item) => item.bucket, options?.order);
}
async function calculateContextTokens(transcriptPath, modelId, offline = false) {
	let content;
	try {
		content = await readFile(transcriptPath, "utf-8");
	} catch (error) {
		logger.debug(`Failed to read transcript file: ${String(error)}`);
		return null;
	}
	const lines = content.split("\n").reverse();
	for (const line of lines) {
		const trimmedLine = line.trim();
		if (trimmedLine === "") continue;
		try {
			const result = safeParse(transcriptMessageSchema, JSON.parse(trimmedLine));
			if (!result.success) continue;
			const obj = result.output;
			if (obj.type === "assistant" && obj.message != null && obj.message.usage != null && obj.message.usage.input_tokens != null) {
				const usage = obj.message.usage;
				const inputTokens = usage.input_tokens + (usage.cache_creation_input_tokens ?? 0) + (usage.cache_read_input_tokens ?? 0);
				let contextLimit = 2e5;
				if (modelId != null && modelId !== "") try {
					var _usingCtx5 = _usingCtx();
					const contextLimitResult = await _usingCtx5.u(new PricingFetcher(offline)).getModelContextLimit(modelId);
					if (isSuccess(contextLimitResult) && contextLimitResult.value != null) contextLimit = contextLimitResult.value;
					else if (isSuccess(contextLimitResult)) logger.debug(`No context limit data available for model ${modelId} in LiteLLM`);
					else logger.debug(`Failed to get context limit for model ${modelId}: ${contextLimitResult.error.message}`);
				} catch (_) {
					_usingCtx5.e = _;
				} finally {
					_usingCtx5.d();
				}
				return {
					inputTokens,
					percentage: Math.min(100, Math.max(0, Math.round(inputTokens / contextLimit * 100))),
					contextLimit
				};
			}
		} catch {
			continue;
		}
	}
	logger.debug("No usage information found in transcript");
	return null;
}
async function loadSessionBlockData(options) {
	try {
		var _usingCtx6 = _usingCtx();
		const claudePaths = toArray(options?.claudePath ?? getClaudePaths());
		const allFiles = [];
		for (const claudePath of claudePaths) {
			const claudeDir = path.join(claudePath, CLAUDE_PROJECTS_DIR_NAME);
			const files = await glob([USAGE_DATA_GLOB_PATTERN], {
				cwd: claudeDir,
				absolute: true
			});
			allFiles.push(...files);
		}
		if (allFiles.length === 0) return [];
		const sortedFiles = await sortFilesByTimestamp(filterByProject(allFiles, (filePath) => extractProjectFromPath(filePath), options?.project));
		const mode = options?.mode ?? "auto";
		const fetcher = _usingCtx6.u(mode === "display" ? null : new PricingFetcher(options?.offline));
		const processedHashes = /* @__PURE__ */ new Set();
		const allEntries = [];
		for (const file of sortedFiles) await processJSONLFileByLine(file, async (line) => {
			try {
				const result = safeParse(usageDataSchema, JSON.parse(line));
				if (!result.success) return;
				const data = result.output;
				const uniqueHash = createUniqueHash(data);
				if (isDuplicateEntry(uniqueHash, processedHashes)) return;
				markAsProcessed(uniqueHash, processedHashes);
				const cost = fetcher != null ? await calculateCostForEntry(data, mode, fetcher) : data.costUSD ?? 0;
				const usageLimitResetTime = getUsageLimitResetTime(data);
				allEntries.push({
					timestamp: new Date(data.timestamp),
					usage: {
						inputTokens: data.message.usage.input_tokens,
						outputTokens: data.message.usage.output_tokens,
						cacheCreationInputTokens: data.message.usage.cache_creation_input_tokens ?? 0,
						cacheReadInputTokens: data.message.usage.cache_read_input_tokens ?? 0
					},
					costUSD: cost,
					model: getDisplayModelName(data) ?? "unknown",
					version: data.version,
					usageLimitResetTime: usageLimitResetTime ?? void 0
				});
			} catch (error) {
				logger.debug(`Skipping invalid JSON line in 5-hour blocks: ${error instanceof Error ? error.message : String(error)}`);
			}
		});
		const blocks = identifySessionBlocks(allEntries, options?.sessionDurationHours);
		return sortByDate(options?.since != null && options.since !== "" || options?.until != null && options.until !== "" ? blocks.filter((block) => {
			const blockDateStr = formatDate(block.startTime.toISOString(), options?.timezone, DEFAULT_LOCALE).replace(/-/g, "");
			if (options.since != null && options.since !== "" && blockDateStr < options.since) return false;
			if (options.until != null && options.until !== "" && blockDateStr > options.until) return false;
			return true;
		}) : blocks, (block) => block.startTime, options?.order);
	} catch (_) {
		_usingCtx6.e = _;
	} finally {
		_usingCtx6.d();
	}
}
export { DEFAULT_RECENT_DAYS as $, PricingFetcher as A, pushBreakdownRows as B, transcriptUsageSchema as C, calculateBurnRate as D, DEFAULT_SESSION_DURATION_HOURS as E, formatDateCompact as F, BLOCKS_COMPACT_WIDTH_THRESHOLD as G, getFileModifiedTime as H, formatModelsDisplayMultiline as I, CLAUDE_PROJECTS_DIR_NAME as J, BLOCKS_DEFAULT_TERMINAL_WIDTH as K, formatNumber as L, addEmptySeparatorRow as M, createUsageReportTable as N, filterRecentBlocks as O, formatCurrency as P, DEFAULT_LOCALE as Q, formatTotalsRow as R, transcriptMessageSchema as S, weeklyUsageSchema as T, unreachable as U, require_picocolors as V, _usingCtx as W, DEBUG_MATCH_THRESHOLD_PERCENT as X, CONFIG_FILE_NAME as Y, DEFAULT_CONTEXT_USAGE_THRESHOLDS as Z, loadWeeklyUsageData as _, dailyUsageSchema as a, try_ as at, sessionUsageSchema as b, getEarliestTimestamp as c, inspectError as ct, loadBucketUsageData as d, isSuccess as dt, DEFAULT_REFRESH_INTERVAL_SECONDS as et, loadDailyUsageData as f, isFailure as ft, loadSessionUsageById as g, loadSessionData as h, createUniqueHash as i, unwrap as it, ResponsiveTable as j, projectBlockUsage as k, getUsageLimitResetTime as l, inspect as lt, loadSessionBlockData as m, __toESM as mt, calculateContextTokens as n, WEEK_DAYS as nt, extractProjectFromPath as o, pipe as ot, loadMonthlyUsageData as p, toArray as pt, BLOCKS_WARNING_THRESHOLD as q, calculateCostForEntry as r, glob as rt, getClaudePaths as s, map$1 as st, bucketUsageSchema as t, USAGE_DATA_GLOB_PATTERN as tt, globUsageFiles as u, succeed as ut, modelBreakdownSchema as v, usageDataSchema as w, sortFilesByTimestamp as x, monthlyUsageSchema as y, formatUsageDataRow as z };

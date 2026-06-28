import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  readFileSync
} from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  isLfsPointer,
  collectCandidates,
  generateAssetsIgnore
} from "../index.js";

const LFS_POINTER = `version https://git-lfs.github.com/spec/v1
oid sha256:0000000000000000000000000000000000000000000000000000000000000000
size 12345
`;

describe("isLfsPointer", () => {
  let root;
  before(() => {
    root = mkdtempSync(join(tmpdir(), "cf-r2-lfs-"));
    writeFileSync(join(root, "pointer.mp3"), LFS_POINTER);
    writeFileSync(
      join(root, "real.mp3"),
      Buffer.from([0xff, 0xfb, 0x90, 0x00])
    );
    writeFileSync(join(root, "empty.mp3"), "");
  });
  after(() => rmSync(root, { recursive: true, force: true }));

  it("detects an un-smudged LFS pointer", () => {
    assert.equal(isLfsPointer(join(root, "pointer.mp3")), true);
  });

  it("returns false for real binary content", () => {
    assert.equal(isLfsPointer(join(root, "real.mp3")), false);
  });

  it("returns false for a file shorter than the pointer header", () => {
    assert.equal(isLfsPointer(join(root, "empty.mp3")), false);
  });

  it("returns false for a nonexistent file", () => {
    assert.equal(isLfsPointer(join(root, "nope.mp3")), false);
  });
});

describe("collectCandidates", () => {
  let baseDir;
  before(() => {
    baseDir = mkdtempSync(join(tmpdir(), "cf-r2-collect-"));
    mkdirSync(join(baseDir, "assets/podcast/audio"), { recursive: true });
    mkdirSync(join(baseDir, "assets/files"), { recursive: true });
    writeFileSync(
      join(baseDir, "assets/podcast/audio/ep1.mp3"),
      Buffer.from([0x00])
    );
    writeFileSync(
      join(baseDir, "assets/podcast/audio/pointer.mp3"),
      LFS_POINTER
    );
    writeFileSync(join(baseDir, "assets/files/doc.pdf"), Buffer.from([0x25]));
    // Dotfiles are ignored.
    writeFileSync(join(baseDir, "assets/files/.DS_Store"), "");
  });
  after(() => rmSync(baseDir, { recursive: true, force: true }));

  const r2Dirs = ["assets/podcast/audio", "assets/files"];

  it("builds keys mirroring the directory layout with detected content types", () => {
    const { candidates } = collectCandidates({
      r2Dirs,
      baseDir,
      checkLfs: false
    });
    const byKey = Object.fromEntries(
      candidates.map((c) => [c.key, c.contentType])
    );
    assert.equal(byKey["assets/podcast/audio/ep1.mp3"], "audio/mpeg");
    assert.equal(byKey["assets/files/doc.pdf"], "application/pdf");
  });

  it("skips dotfiles", () => {
    const { candidates } = collectCandidates({
      r2Dirs,
      baseDir,
      checkLfs: false
    });
    assert.ok(!candidates.some((c) => c.key.endsWith(".DS_Store")));
  });

  it("with checkLfs, separates pointers from real candidates", () => {
    const { candidates, pointerFiles } = collectCandidates({
      r2Dirs,
      baseDir,
      checkLfs: true
    });
    assert.deepEqual(pointerFiles, ["assets/podcast/audio/pointer.mp3"]);
    assert.ok(!candidates.some((c) => c.key.endsWith("pointer.mp3")));
    assert.ok(candidates.some((c) => c.key.endsWith("ep1.mp3")));
  });

  it("without checkLfs, treats pointer files as ordinary candidates", () => {
    const { pointerFiles, candidates } = collectCandidates({
      r2Dirs,
      baseDir,
      checkLfs: false
    });
    assert.deepEqual(pointerFiles, []);
    assert.ok(candidates.some((c) => c.key.endsWith("pointer.mp3")));
  });

  it("skips directories that do not exist", () => {
    const { candidates } = collectCandidates({
      r2Dirs: ["assets/files", "assets/missing"],
      baseDir,
      checkLfs: false
    });
    assert.ok(candidates.some((c) => c.key === "assets/files/doc.pdf"));
    assert.ok(!candidates.some((c) => c.key.startsWith("assets/missing")));
  });
});

describe("generateAssetsIgnore", () => {
  let projectRoot;
  before(() => {
    projectRoot = mkdtempSync(join(tmpdir(), "cf-r2-ignore-"));
    writeFileSync(
      join(projectRoot, ".assetsignore.template"),
      "**/node_modules\n**/.DS_Store\n**/.git\n**/worker\n"
    );
  });
  after(() => rmSync(projectRoot, { recursive: true, force: true }));

  it("appends R2 dirs beneath the trimmed template", () => {
    generateAssetsIgnore({
      r2Dirs: ["assets/podcast/audio", "assets/files"],
      projectRoot
    });
    const output = readFileSync(join(projectRoot, ".assetsignore"), "utf8");
    assert.equal(
      output,
      "**/node_modules\n**/.DS_Store\n**/.git\n**/worker\n\n" +
        "# Large files served from R2 (generated from _cloudflare/r2/config.js)\n" +
        "assets/podcast/audio\nassets/files\n"
    );
  });
});

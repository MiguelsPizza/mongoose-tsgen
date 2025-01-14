import { setupFolderStructure, cleanup } from "./utils";
import * as generator from "../generator";
import * as paths from "../paths";
import * as tsReader from "../tsReader";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { loadModels } from "../../parser/utils";

function getExpectedString(filename: string) {
  return fs.readFileSync(path.join(__dirname, `artifacts/${filename}`), "utf8");
}

function cleanupModelsInMemory() {
  delete mongoose.models.User;
  delete mongoose.connection.collections.users;
}

// these tests are more integration tests than unit - should split them out

describe("generateTypes", () => {
  beforeAll(cleanup);

  afterEach(cleanup);
  afterEach(cleanupModelsInMemory);

  const generatedFilePath = "mtgen-test.ts";

  test("generate file string success", async () => {
    setupFolderStructure("./models", "user", true);
    const modelsPaths = await paths.getModelsPaths("./src/helpers/tests/models/user.ts");
    const cleanupTs = tsReader.registerUserTs("tsconfig.test.json");

    let sourceFile = generator.createSourceFile(generatedFilePath);
    sourceFile = await generator.generateTypes({
      modelsPaths,
      sourceFile,
      noMongoose: false,
      datesAsStrings: false
    });

    const modelTypes = tsReader.getModelTypes(modelsPaths);
    const models = loadModels(modelsPaths);

    generator.replaceModelTypes(sourceFile, modelTypes, models);
    generator.addPopulateHelpers(sourceFile);
    generator.overloadQueryPopulate(sourceFile);

    cleanupTs?.();
    expect(sourceFile.getFullText().trim()).toBe(getExpectedString("user.gen.ts").trim());
  });

  // TODO: the next 2 tests are kinda random and out of place. First one covers all the latest changes
  // related to allowing multiple schemas per model file. Second covers a few niche schema options.
  // Both should be split into unit tests once their code has been modularized
  test("generate different types of model inits", async () => {
    const modelsPaths = await paths.getModelsPaths("./src/helpers/tests/artifacts/device.ts");
    const cleanupTs = tsReader.registerUserTs("tsconfig.test.json");

    let sourceFile = generator.createSourceFile(generatedFilePath);
    sourceFile = await generator.generateTypes({
      modelsPaths,
      sourceFile,
      noMongoose: false,
      datesAsStrings: false
    });

    const modelTypes = tsReader.getModelTypes(modelsPaths);
    const models = loadModels(modelsPaths);

    generator.replaceModelTypes(sourceFile, modelTypes, models);
    generator.addPopulateHelpers(sourceFile);
    generator.overloadQueryPopulate(sourceFile);

    cleanupTs?.();
    expect(sourceFile.getFullText().trim()).toBe(getExpectedString("device.gen.ts").trim());
  });

  test("generate other schema options", async () => {
    const modelsPaths = await paths.getModelsPaths("./src/helpers/tests/artifacts/user2.ts");
    const cleanupTs = tsReader.registerUserTs("tsconfig.test.json");

    let sourceFile = generator.createSourceFile(generatedFilePath);
    sourceFile = await generator.generateTypes({
      modelsPaths,
      sourceFile,
      noMongoose: false,
      datesAsStrings: false
    });

    const modelTypes = tsReader.getModelTypes(modelsPaths);
    const models = loadModels(modelsPaths);
    generator.replaceModelTypes(sourceFile, modelTypes, models);
    generator.addPopulateHelpers(sourceFile);
    generator.overloadQueryPopulate(sourceFile);

    cleanupTs?.();
    expect(sourceFile.getFullText().trim()).toBe(getExpectedString("user2.gen.ts").trim());
  });

  test("generate model with subdocument field named models", async () => {
    const modelsPaths = await paths.getModelsPaths("./src/helpers/tests/artifacts/landingPage.ts");
    const cleanupTs = tsReader.registerUserTs("tsconfig.test.json");

    let sourceFile = generator.createSourceFile(generatedFilePath);
    sourceFile = await generator.generateTypes({
      modelsPaths,
      sourceFile,
      noMongoose: false,
      datesAsStrings: false
    });

    const modelTypes = tsReader.getModelTypes(modelsPaths);
    const models = loadModels(modelsPaths);

    generator.replaceModelTypes(sourceFile, modelTypes, models);
    generator.addPopulateHelpers(sourceFile);
    generator.overloadQueryPopulate(sourceFile);

    cleanupTs?.();
    expect(sourceFile.getFullText().trim()).toBe(getExpectedString("landingPage.gen.ts").trim());
  });
});

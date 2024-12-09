import JSONDocs from "@/docs.json";

type Documentation = {
  decl: Package;
  version: string;
};

export type Package = {
  description: string;
  kind: string;
  modules?: Module[];
  name: string;
  packages?: Package[];
  summary: string;
};

export type Module = {
  aliases?: Alias[];
  description: string;
  functions?: Function[];
  kind: string;
  name: string;
  structs?: Struct[];
  summary: string;
  traits?: Trait[];
  deprecated?: string;
};

export type Alias = {
  description: string;
  kind: string;
  name: string;
  summary: string;
  value: string;
  deprecated?: string;
};

export type Function = {
  kind: string;
  name: string;
  overloads?: Overload[];
};

export type Trait = {
  deprecated?: string;
  description: string;
  functions?: Function[];
  kind: string;
  name: string;
  parentTraits?: string[];
  summary: string;
};

export type Overload = {
  args?: Argument[];
  async?: boolean;
  constraints: string;
  description: string;
  isDef?: boolean;
  isStatic: boolean;
  kind: string;
  name: string;
  parameters?: Parameter[];
  raises: boolean;
  returnType?: string | null;
  returns?: string;
  signature: string;
  summary: string;
  deprecated?: string;
  raisesDoc?: string;
  returnsDoc?: string;
  convention?: string;
};

export type Argument = {
  description: string;
  inout?: boolean;
  kind: string;
  name: string;
  owned?: boolean;
  passingKind: string;
  type: string;
  convention?: string;
  default?: string;
  deprecated?: string;
};

export type Parameter = {
  description: string;
  kind: string;
  name: string;
  type: string;
};

export type Struct = {
  aliases?: Alias[];
  constraints: string;
  description: string;
  fields?: Field[];
  functions?: Function[];
  kind: string;
  name: string;
  parameters?: Parameter[];
  parentTraits?: string[] | null;
  summary: string;
  deprecated?: string;
};

export type Field = {
  description: string;
  kind: string;
  name: string;
  summary: string;
  type: string;
};

const Docs: Documentation = JSONDocs;

export type IndexedPackage = {
  package: Package;
  path: string;
};

export type IndexedModule = {
  module: Module;
  path: string;
};

export type FunctionWithModule = Function & {
  module: string;
};

export type StructWithModule = Struct & {
  module: string;
};

export type AliasWithModule = Alias & {
  module: string;
};

export type TraitWithModule = Trait & {
  module: string;
};

export type ModuleItems = {
  functions: FunctionWithModule[];
  types: StructWithModule[];
  constants: AliasWithModule[];
  variables: AliasWithModule[];
  traits: TraitWithModule[];
};

export function isModule(item: Package | Module): item is Module {
  return "functions" in item;
}

export function getAllPackages(): IndexedPackage[] {
  const packages: IndexedPackage[] = [];
  let defaultPackage: IndexedPackage | null = null;

  function walk(pkg: Package, path: string) {
    packages.push({ package: pkg, path });

    if (pkg.packages) {
      pkg.packages.forEach((p) => {
        walk(p, `${path}/${p.name}`);
      });
    }
  }

  if (Docs.decl.modules && Docs.decl.modules.length > 0) {
    defaultPackage = {
      package: {
        name: "Default",
        kind: "package",
        description: "Default package containing top-level modules",
        summary:
          "Contains all modules not explicitly placed in a named package",
        modules: Docs.decl.modules,
      },
      path: "/Default",
    };
  }

  if (Docs.decl.packages) {
    Docs.decl.packages.forEach((p) => {
      walk(p, `/${p.name}`);
    });
  }

  if (defaultPackage) {
    packages.push(defaultPackage);
  }

  return packages;
}

export function getAllModules(): IndexedModule[] {
  const modules: IndexedModule[] = [];

  function walk(pkg: Package, path: string) {
    if (pkg.modules) {
      pkg.modules.forEach((m) => {
        modules.push({ module: m, path: `${path}#${m.name}` });
      });
    }

    if (pkg.packages) {
      pkg.packages.forEach((p) => {
        walk(p, `${path}/${p.name}`);
      });
    }
  }

  walk(Docs.decl, "");

  return modules;
}

export function findPackage(
  pkg: string[],
  currentPackage: Package = Docs.decl,
): Package | undefined {
  if (pkg.length === 0) {
    return currentPackage;
  }

  if (
    pkg.length === 1 &&
    !currentPackage.packages?.find((p) => p.name === pkg[0])
  ) {
    return {
      name: "Default",
      kind: "package",
      description: "Default package containing top-level modules",
      summary: "Contains all modules not explicitly placed in a named package",
      modules: Docs.decl.modules || [],
    };
  }

  const nextPackage = currentPackage.packages?.find((p) => p.name === pkg[0]);
  if (!nextPackage) {
    return undefined;
  }

  return findPackage(pkg.slice(1), nextPackage);
}

export const collectModuleItems = (module: Module): ModuleItems => {
  const items: ModuleItems = {
    functions: [],
    types: [],
    constants: [],
    variables: [],
    traits: [],
  };

  module.functions?.forEach((fn) =>
    items.functions.push({ ...fn, module: module.name }),
  );
  module.structs?.forEach((struct) =>
    items.types.push({ ...struct, module: module.name }),
  );
  module.aliases?.forEach((alias) => {
    if (alias.value?.includes("const")) {
      items.constants.push({ ...alias, module: module.name });
    } else {
      items.variables.push({ ...alias, module: module.name });
    }
  });
  module.traits?.forEach((trait) =>
    items.traits.push({ ...trait, module: module.name }),
  );

  return items;
};

export const sortModuleItems = (a: ModuleItems, b: ModuleItems) => {
  const aVarCount = a.variables.length;
  const bVarCount = b.variables.length;
  if (aVarCount !== bVarCount) return aVarCount - bVarCount;

  const getTotal = (items: ModuleItems) =>
    Object.values(items).reduce((acc, curr) => acc + curr.length, 0);

  return getTotal(a) - getTotal(b);
};

export function collectAllItems(packages: any[]) {
  const allItems = new Map<
    string,
    {
      constants: any[];
      variables: any[];
      functions: any[];
      types: any[];
      description: string;
      moduleItems?: Map<
        string,
        {
          constants: any[];
          variables: any[];
          functions: any[];
          types: any[];
          traits: any[];
          description: string;
        }
      >;
    }
  >();

  packages.forEach((pkgData) => {
    const pkg = pkgData.package;
    const items = {
      constants: [] as any[],
      variables: [] as any[],
      functions: [] as any[],
      types: [] as any[],
      traits: [] as any[],
      description: pkg.description || "",
      moduleItems: new Map() as
        | Map<
            string,
            {
              constants: any[];
              variables: any[];
              functions: any[];
              types: any[];
              traits: any[];
              description: string;
            }
          >
        | undefined, // Create moduleItems for all packages
    };

    // Handle package-level items first
    pkg.functions?.forEach((fn: any) => {
      items.functions.push({
        name: fn.name,
        type: "function",
        description: fn.overloads?.[0]?.description || "",
      });
    });

    pkg.structs?.forEach((struct: any) => {
      items.types.push({
        name: struct.name,
        type: "struct",
        description: struct.description || "",
      });
    });

    pkg.aliases?.forEach((alias: any) => {
      if (alias.value?.includes("const")) {
        items.constants.push({
          name: alias.name,
          type: "const",
          description: alias.description || "",
        });
      } else {
        items.variables.push({
          name: alias.name,
          type: "var",
          description: alias.description || "",
        });
      }
    });

    pkg.traits?.forEach((trait: any) => {
      items.traits.push({
        name: trait.name,
        type: "trait",
        description: trait.description || "",
      });
    });

    // Handle module items
    pkg.modules?.forEach((module: any) => {
      const moduleItems = {
        constants: [] as any[],
        variables: [] as any[],
        functions: [] as any[],
        types: [] as any[],
        traits: [] as any[],
        description: module.description || "",
      };

      module.functions?.forEach((fn: any) => {
        moduleItems.functions.push({
          name: fn.name,
          module: module.name,
          type: "function",
          description: fn.overloads?.[0]?.description || "",
        });
      });

      module.structs?.forEach((struct: any) => {
        moduleItems.types.push({
          name: struct.name,
          module: module.name,
          type: "struct",
          description: struct.description || "",
        });
      });

      module.aliases?.forEach((alias: any) => {
        if (alias.value?.includes("const")) {
          moduleItems.constants.push({
            name: alias.name,
            module: module.name,
            type: "const",
            description: alias.description || "",
          });
        } else {
          moduleItems.variables.push({
            name: alias.name,
            module: module.name,
            type: "var",
            description: alias.description || "",
          });
        }
      });

      module.traits?.forEach((trait: any) => {
        moduleItems.traits.push({
          name: trait.name,
          module: module.name,
          type: "trait",
          description: trait.description || "",
        });
      });

      // Only add module if it has any items
      if (
        moduleItems.functions.length > 0 ||
        moduleItems.types.length > 0 ||
        moduleItems.constants.length > 0 ||
        moduleItems.variables.length > 0 ||
        moduleItems.traits.length > 0
      ) {
        items.moduleItems?.set(module.name, moduleItems);
      }
    });

    // If no modules have items, remove the moduleItems map
    if (items.moduleItems?.size === 0) {
      delete items.moduleItems;
    }

    allItems.set(pkg.name, items);
  });

  return allItems;
}

export default Docs;

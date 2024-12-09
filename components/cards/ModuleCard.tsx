import { Alias, Module } from "@/lib/docs";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import FunctionCard from "./FunctionCard";
import StructCard from "./StructCard";

const AliasValue = ({ alias }: { alias: Alias }) => (
  <span className="text-sm text-primary/90">
    {alias.name} = {alias.value}
  </span>
);

export default function ModuleCard({ mdl, pkg }: { mdl: Module; pkg: string }) {
  return (
    <Card id={mdl.name}>
      <CardHeader>
        <CardTitle className="capitalize">{mdl.name}</CardTitle>
      </CardHeader>
      <CardContent>
        {mdl.aliases && mdl.aliases.length > 0 && (
          <>
            <div className="flex flex-col gap-1">
              <h2 className="text-md text-primary/90">Aliases</h2>
              <Separator className="w-1/4" />
              {mdl.aliases.map((alias) => (
                <AliasValue alias={alias} key={alias.name} />
              ))}
            </div>
            <div className="p-4" />
          </>
        )}
        {mdl.structs && mdl.structs.length > 0 && (
          <>
            <div className="flex flex-col gap-1">
              <h2 className="text-md text-primary/90">Structs</h2>
              <Separator className="w-1/4" />
              {mdl.structs.map((struct) => (
                <StructCard
                  struct={struct}
                  key={struct.name}
                  pkg={pkg}
                  modName={mdl.name}
                />
              ))}
            </div>
            <div className="p-4" />
          </>
        )}
        {mdl.functions && mdl.functions.length > 0 && (
          <>
            <div className="flex flex-col gap-1">
              <h2 className="text-md text-primary/90">Functions</h2>
              <Separator className="w-1/4" />
              {mdl.functions.map((func) => (
                <FunctionCard
                  func={func}
                  key={func.name}
                  pkg={pkg}
                  modName={mdl.name}
                />
              ))}
            </div>
            <div className="p-4" />
          </>
        )}
      </CardContent>
    </Card>
  );
}

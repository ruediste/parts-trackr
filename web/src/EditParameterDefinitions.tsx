import { EditList } from "./EditList";
import Input, { Select } from "./Input";
import { ParameterDefinitionBase, ParameterType, Unit } from "./Location";

export function EditParameterDefinitions<T extends ParameterDefinitionBase>({
  url,
  generateAddValue,
  onModified,
}: {
  url: string;
  generateAddValue: () => T;
  onModified: () => void;
}) {
  return (
    <EditList<T, T>
      columns={[
        { label: "Name", render: (p) => p.name },
        { label: "Type", render: (p) => p.type },
        { label: "Unit", render: (p) => p.unit },
        { label: "Values", render: (p) => p.values?.join(" ") },
      ]}
      url={url}
      createAddValue={generateAddValue}
      onPreSave={(def) => {
        if (def.type === "VALUE" && def.unit === undefined) def.unit = "VOLT";
      }}
      renderEdit={({ bind, value }) => {
        const commonInputs = (
          <>
            <Input label="Name" {...bind("name")} />
            <Select<ParameterType>
              label="Type"
              {...bind("type")}
              updateOnChange
              options={[
                { label: "Text", value: "TEXT" },
                { label: "Number", value: "NUMBER" },
                { label: "Value", value: "VALUE" },
                { label: "Choice", value: "CHOICE" },
              ]}
            />
          </>
        );

        switch (value.type) {
          case "VALUE":
            return (
              <>
                {commonInputs}
                <Select<Unit | undefined>
                  label="Unit"
                  {...bind("unit")}
                  options={[
                    { label: "Volt", value: "VOLT" },
                    { label: "Ampere", value: "AMPERE" },
                    { label: "Watt", value: "WATT" },
                    { label: "Meter", value: "METER" },
                    { label: "Watt Hours", value: "WATT_HOURS" },
                    { label: "Ampere Hours", value: "AMPERE_HOURS" },
                    { label: "Ohm", value: "OHM" },
                    { label: "Farad", value: "FARAD" },
                    { label: "Henry", value: "HENRY" },
                  ]}
                />
              </>
            );
          case "CHOICE":
            return (
              <>
                {commonInputs}
                TODO
              </>
            );
        }
        return commonInputs;
      }}
    />
  );
}

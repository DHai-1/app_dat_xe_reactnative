import type { ComponentProps, ComponentRef, Ref } from "react";
import { TextInput } from "react-native-paper";
import { NativeDraftTextInput } from "./NativeDraftTextInput";

type Props = ComponentProps<typeof TextInput> & { draftValue?: string };

function EditableTextInput({ draftValue, defaultValue, value, render, ...props }: Props) {
  return (
    <TextInput
      autoCorrect={false}
      spellCheck={false}
      {...props}
      defaultValue={defaultValue}
      value={draftValue ?? value}
      render={render ?? (({ value: paperValue, ref: paperRef, ...nativeProps }) => (
        <NativeDraftTextInput
          {...nativeProps}
          // Paper's render type describes the component rather than its native instance.
          ref={paperRef as unknown as Ref<ComponentRef<typeof NativeDraftTextInput>>}
          value={value !== undefined && draftValue === undefined ? paperValue : undefined}
          defaultValue={defaultValue}
          draftValue={draftValue}
        />
      ))}
    />
  );
}

export const PaperTextInput = Object.assign(EditableTextInput, { Icon: TextInput.Icon });

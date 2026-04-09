import { PatnaAssistant } from "@/components/patna-assistant";

export default function MemberAppLayout({ children }) {
  return (
    <>
      {children}
      <PatnaAssistant />
    </>
  );
}

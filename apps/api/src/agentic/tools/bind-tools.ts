import { tool } from "@langchain/core/tools";

export function createBoundTools(tools: any[], userId: string) {
  return tools.map(t => {
    const hasUserIdField = t.schema?.shape?.userId;

    if (hasUserIdField) {
      return tool(
        async (input: any) => {
          return t.invoke({ ...input, userId });
        },
        {
          name: t.name,
          description: t.description,
          schema: t.schema,
        }
      );
    }

    return t;
  });
}

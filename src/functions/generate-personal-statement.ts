import { supabase } from "@/integrations/supabase/client";

export const generatePersonalStatement = async (answers: Record<string, any>): Promise<string> => {
  try {
    const functionCall = supabase.functions.invoke('generate-personal-statement', {
      body: { answers }
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Function call timed out after 30 seconds")), 30000)
    );



    const { data, error } = await Promise.race([functionCall, timeoutPromise]) as any;

    if (error) {
      console.error("Error generating personal statement:", error);
      throw new Error(`Failed to generate personal statement: ${error.message}`);
    }

    if (!data || !data.personalStatement) {
      throw new Error("No personal statement was generated");
    }

    return data.personalStatement;
  } catch (error) {
    console.error("Error in generatePersonalStatement function:", error);
    throw error;
  }
};

export const savePersonalStatement = async (title: string, content: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('personal_statements')
      .insert({
        title,
        content,
        user_id: (await supabase.auth.getUser()).data.user?.id
      });

    if (error) {
      console.error("Error saving personal statement:", error);
      throw new Error(`Failed to save personal statement: ${error.message}`);
    }
  } catch (error) {
    console.error("Error in savePersonalStatement function:", error);
    throw error;
  }
};



// Reference resolution only. These fields never establish religious support.
export type AskTaskContext = {
  visitor_message: string;
  resolved_question: string;
  parent_sentences: string[];
  relevant_user_messages: string[];
};

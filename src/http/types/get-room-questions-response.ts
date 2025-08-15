export type GetRoomQuestionsResponse = {
  id: string;
  question: string;
  answer?: string;
  createdAt: Date;
  isGeneratingAnswer?: boolean;
}[];

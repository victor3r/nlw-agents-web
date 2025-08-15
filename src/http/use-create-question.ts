import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateQuestionRequest } from './types/create-question-request';
import type { CreateQuestionResponse } from './types/create-question-response';
import type { GetRoomQuestionsResponse } from './types/get-room-questions-response';

export function useCreateQuestion(roomId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateQuestionRequest) => {
      const response = await fetch(
        `http://localhost:3333/rooms/${roomId}/questions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );

      const result: CreateQuestionResponse = await response.json();

      return result;
    },
    onMutate: ({ question }) => {
      const previousQuestions =
        queryClient.getQueryData<GetRoomQuestionsResponse>([
          'get-room-questions',
          roomId,
        ]);

      const newQuestion = {
        id: crypto.randomUUID(),
        question,
        createdAt: new Date(),
        isGeneratingAnswer: true,
      };

      queryClient.setQueryData<GetRoomQuestionsResponse>(
        ['get-room-questions', roomId],
        old => (old ? [newQuestion, ...old] : [newQuestion])
      );

      return { previousQuestions, newQuestion };
    },
    onError: (_err, _newQuestion, context) => {
      queryClient.setQueryData(
        ['get-room-questions', roomId],
        context?.previousQuestions
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['get-room-questions', roomId],
      });
    },
  });
}

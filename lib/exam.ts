import { prisma } from "./prisma";

/**
 * Selects questions for Examen Blanc using stratified random sampling
 * Ensures balanced distribution across all 15 series (2 questions per series)
 * 
 * Algorithm: Stratified Random Sampling
 * - For each series 1-15: fetch all questions, shuffle, take first N
 * - Combine results and shuffle once more for question order randomness
 * 
 * @param totalQuestions - Total questions to select (default: 30)
 * @returns Array of selected question IDs
 */
export async function selectQuestionsForMockExam(totalQuestions: number = 30): Promise<string[]> {
  const numSeries = 15;
  const questionsPerSeries = Math.floor(totalQuestions / numSeries);
  const remainder = totalQuestions % numSeries;

  const selectedQuestionIds: string[] = [];

  try {
    // For each series, select questions with stratified sampling
    for (let series = 1; series <= numSeries; series++) {
      // Calculate quota for this series
      // First 'remainder' series get an extra question
      const quota = questionsPerSeries + (series <= remainder ? 1 : 0);

      if (quota <= 0) continue;

      // Fetch all questions from this series
      const seriesQuestions = await prisma.question.findMany({
        where: { series, themeId: null },
        select: { id: true },
        orderBy: { id: 'asc' }
      });

      if (seriesQuestions.length === 0) {
        console.warn(`[Mock Exam] No questions found for series ${series}`);
        continue;
      }

      // Shuffle and select (provides within-series randomness)
      const shuffled = fisherYatesShuffle(seriesQuestions);
      const selected = shuffled.slice(0, Math.min(quota, shuffled.length));

      selectedQuestionIds.push(...selected.map(q => q.id));
    }

    // Verify we have enough questions
    if (selectedQuestionIds.length < totalQuestions) {
      console.warn(
        `[Mock Exam] Only found ${selectedQuestionIds.length}/${totalQuestions} questions. ` +
        `Using available ${selectedQuestionIds.length}.`
      );
    }

    // Final shuffle to randomize question order
    const finalShuffled = fisherYatesShuffle(
      selectedQuestionIds.map(id => ({ id }))
    );

    return finalShuffled.map(q => q.id);
  } catch (error) {
    console.error("[Mock Exam] Error selecting questions:", error);
    throw error;
  }
}

/**
 * Fisher-Yates shuffle algorithm
 * Provides true random permutations with O(n) time complexity
 * 
 * @param array - Array to shuffle
 * @returns New shuffled array (original unchanged)
 */
function fisherYatesShuffle<T>(array: T[]): T[] {
  const arr = [...array]; // Create copy to avoid mutation

  for (let i = arr.length - 1; i > 0; i--) {
    // Random index from 0 to i (inclusive)
    const j = Math.floor(Math.random() * (i + 1));

    // Swap elements at i and j
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

/**
 * Checks if user has unlocked the Examen Blanc
 * User must have passed all 15 series quizzes
 * 
 * @param userId - User ID to check
 * @returns Object with unlock status and details
 */
export async function checkMockExamUnlock(userId: string) {
  try {
    // Get all series this user has completed (passed)
    const completedSeries = await prisma.quizAttempt.findMany({
      where: {
        userId,
        isMockExam: false,
        series: { not: null },
        themeId: null,
        passed: true
      },
      select: { series: true },
      distinct: ['series'] // Get unique series only
    });

    const completedCount = completedSeries.length;
    const completedSeriesNumbers = new Set(
      completedSeries
        .map(a => a.series)
        .filter((s): s is number => s !== null)
    );

    // Calculate missing series
    const allSeries = new Set(Array.from({ length: 15 }, (_, i) => i + 1));
    const missingSeries = Array.from(allSeries).filter(s => !completedSeriesNumbers.has(s));

    const canAccess = completedCount === 15;

    return {
      canAccess,
      completedSeries: completedCount,
      totalRequired: 15,
      missingSeries,
      progress: `${completedCount}/15`
    };
  } catch (error) {
    console.error("[Mock Exam] Error checking unlock status:", error);
    throw error;
  }
}

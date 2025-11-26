//=========SHOULD NOT NEED TO TOUCH THIS METHOD AT ALL!==============
export function computeLevenshteinDistance(phrase1: string, phrase2: string) //this computers error between two strings
{
    // let distance = new int[phrase1.length + 1][phrase2.length + 1];
    const distance: number[][] = [];
    for (let i = 0; i < phrase1.length + 1; ++i) {
        const tempArr: number[] = [];
        for (let j = 0; j < phrase2.length + 1; ++j) {
            tempArr.push(0);
        }
        distance.push(tempArr);
    }

    for (let i = 0; i <= phrase1.length; i++)
        distance[i][0] = i;
    for (let j = 1; j <= phrase2.length; j++)
        distance[0][j] = j;

    for (let i = 1; i <= phrase1.length; i++)
        for (let j = 1; j <= phrase2.length; j++)
        distance[i][j] = Math.min(Math.min(distance[i - 1][j] + 1, distance[i][j - 1] + 1), distance[i - 1][j - 1] + ((phrase1.charAt(i - 1) == phrase2.charAt(j - 1)) ? 0 : 1));

    return distance[phrase1.length][phrase2.length];
}

/*
int[][] distance = new int[phrase1.length() + 1][phrase2.length() + 1];

  for (int i = 0; i <= phrase1.length(); i++)
    distance[i][0] = i;
  for (int j = 1; j <= phrase2.length(); j++)
    distance[0][j] = j;

  for (int i = 1; i <= phrase1.length(); i++)
    for (int j = 1; j <= phrase2.length(); j++)
      distance[i][j] = min(min(distance[i - 1][j] + 1, distance[i][j - 1] + 1), distance[i - 1][j - 1] + ((phrase1.charAt(i - 1) == phrase2.charAt(j - 1)) ? 0 : 1));

  return distance[phrase1.length()][phrase2.length()];
*/
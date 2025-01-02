const splitSafely = (
  firstChoice: string | undefined,
  secondChoice: string | undefined,
  character = ","
) => {
  return firstChoice
    ? firstChoice?.split(character)
    : secondChoice?.split(character) || [];
};

export default splitSafely;

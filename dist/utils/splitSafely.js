const splitSafely = (firstChoice, secondChoice, character = ",") => {
    return firstChoice
        ? firstChoice?.split(character)
        : secondChoice?.split(character) || [];
};
export default splitSafely;

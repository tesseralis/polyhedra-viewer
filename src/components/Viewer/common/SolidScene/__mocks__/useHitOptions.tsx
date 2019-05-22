

export const setHitOption = jest.fn();
export const unsetHitOption = jest.fn();
export const applyWithHitOption = jest.fn();

export default function useHitOptions() {
  return { setHitOption, unsetHitOption, applyWithHitOption };
}

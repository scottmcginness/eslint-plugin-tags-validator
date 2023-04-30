/**
 * Creates a new function that stores the value of the given function so it is only called once.
 * @template TIn,TOut
 * @param {((arg: TIn) => TOut)} func - The function to memoize. It should take a single argument only.
 * @returns {((arg: TIn) => TOut)}
 */
module.exports = (func) => {
  /** @type {TOut} */
  let value = null;

  return (arg) => {
    if (value === null) {
      value = func(arg);
    }

    return value;
  };
};


// kitchen sink functions

// Returns a random integer between min (included) and max (excluded)
// Using Math.round() will give you a non-uniform distribution!
const getRandomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min)) + min;
}

// asyncThingsArray - array of functions that require a callback as their last argument
const asyncAll = (asyncThingsArray, finalCb) => {
  var numberCompleted = 0;
  var hasErrors = false;
  var isComplete = false;
  const numberWantedComplete = asyncThingsArray.length;
  const results = new Array(numberWantedComplete);
  const errors = new Array(numberWantedComplete);
  const callbackShim = function(index, error, result) {
    if (isComplete) {
      throw new Error("Illegal state, too many callbacks from async functions called");
    }
    numberCompleted++;
    if (result) {
      results[index] = result;
    }
    if (error) {
      errors[index] = error;
      hasErrors = true;
    }
    if (numberCompleted == numberWantedComplete) {
      isComplete = true;
      return finalCb(hasErrors ? errors : undefined, results);
    }
  };
  asyncThingsArray.forEach((fn, index) => {
    fn(callbackShim.bind(null, index));
  });
};

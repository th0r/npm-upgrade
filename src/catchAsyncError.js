export default function catchAsyncError(asyncFn) {
  return function () {
    return asyncFn
      .apply(this, arguments)
      .catch(err => {
        console.error(err);
        process.exit(1);
      });
  };
}

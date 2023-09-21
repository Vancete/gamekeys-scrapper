export const cleanFileName = (fileName) => {
  // Define a regular expression that allows only alphanumeric characters, underscores, and periods.
  const validPattern = /[^a-zA-Z0-9_.-]/g;

  // Replace invalid characters with an underscore "_" in this case.
  const cleanName = fileName.replace(validPattern, "-").toLowerCase();

  return cleanName;
};

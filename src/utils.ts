 const stringHasLength=(line: string): boolean => {
  return !!line && line.length > 0;
}

 const removeSpaces=(str: string): string => {
  return (str || '').replace(/^\s*|\s*$/g, '');
}

export { stringHasLength, removeSpaces }

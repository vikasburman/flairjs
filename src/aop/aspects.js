// Aspects
let allAspects = {};
flair.Aspects = {};
flair.Aspects.register = (pointcut, Aspect) => {
    // pointcut: classNamePattern.funcNamePattern
    //      classNamePattern:
    //          * - any class
    //          *<text> - any class name that ends with <text>
    //          <text>* - any class name that starts with <text>
    //          <text>  - exact class name
    //      funcNamePattern:
    //          * - any function
    //          *<text> - any func name that ends with <text>
    //          <text>* - any func name that starts with <text>
    //          <text>  - exact func name
    if (!allAspects[pointcut]) {
        allAspects[pointcut] = [];
    }
    allAspects[pointcut].push(Aspect);
};

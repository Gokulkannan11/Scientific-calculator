
(() => {
  const exprEl = document.getElementById("expr");
  const ansEl  = document.getElementById("ans");
  const degToggle = document.getElementById("degToggle");
  let expr = "";


  function toRad(x){ return x * Math.PI / 180; }
  function sinf(x){ return degToggle.checked ? Math.sin(toRad(x)) : Math.sin(x); }
  function cosf(x){ return degToggle.checked ? Math.cos(toRad(x)) : Math.cos(x); }
  function tanf(x){ return degToggle.checked ? Math.tan(toRad(x)) : Math.tan(x); }
  function log10(x){ return Math.log10(x); }
  function lnf(x){ return Math.log(x); }
  function sqrtf(x){ return Math.sqrt(x); }
  function fact(n){
    n = Number(n);
    if (!Number.isInteger(n) || n < 0) return NaN;
    if (n > 170) return Infinity; // prevent overflow
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;
    return r;
  }

  document.querySelectorAll("[data-val]").forEach(btn=>{
    btn.addEventListener("click", () => {
      append(btn.getAttribute("data-val"));
    });
  });

  document.querySelectorAll("[data-fn]").forEach(btn=>{
    btn.addEventListener("click", () => {
      const fn = btn.getAttribute("data-fn");
      handleFn(fn);
    });
  });

  document.querySelectorAll("[data-act]").forEach(btn=>{
    btn.addEventListener("click", () => {
      const act = btn.getAttribute("data-act");
      if (act === "clear") { expr = ""; render(); setAns("= 0"); }
      if (act === "back")  { expr = expr.slice(0, -1); render(); }
      if (act === "percent"){ percentTransform(); }
      if (act === "equals"){ evaluateExpr(); }
    });
  });


  window.addEventListener("keydown", (e) => {
    const k = e.key;
    if (/[\d.()]/.test(k)) { append(k); return; }
    if (k === "+" || k === "-" || k === "*" || k === "/" || k === "^") {
      append(k === "*" ? "×" : k === "/" ? "÷" : k === "-" ? "−" : k);
      return;
    }
    if (k === "Enter") { e.preventDefault(); evaluateExpr(); }
    if (k === "Backspace") { expr = expr.slice(0, -1); render(); }
    if (k === "Escape") { expr = ""; render(); setAns("= 0"); }
  });

  function append(v){
    expr += String(v);
    render();
  }

  function render(){
    exprEl.value = expr || "";
  }

  function setAns(text){
    ansEl.textContent = text;
  }

  function handleFn(fn){
    const lastNumber = /(\d+(\.\d+)?)$/;
    switch(fn){
      case "sqrt": append("sqrt("); break;
      case "sin":  append("sin("); break;
      case "cos":  append("cos("); break;
      case "tan":  append("tan("); break;
      case "ln":   append("ln("); break;
      case "log":  append("log("); break;
      case "pow":  append("^"); break;
      case "sqr":
        if (lastNumber.test(expr)) expr = expr.replace(lastNumber, "($&^2)");
        else append("^2");
        render();
        break;
      case "cube":
        if (lastNumber.test(expr)) expr = expr.replace(lastNumber, "($&^3)");
        else append("^3");
        render();
        break;
      case "fact":
        
        if (/\d$/.test(expr)) { append("!"); }
        break;
      default: break;
    }
  }

  function percentTransform(){
    expr = expr.replace(/(\d+(\.\d+)?)%/g, "($1/100)");
    render();
  }


  function transformExpression(src){
    let s = " " + src + " "; 

    
    s = s.replace(/÷/g, "/")
         .replace(/×/g, "*")
         .replace(/−/g, "-")
         .replace(/\^/g, "**");

   
    s = s.replace(/π/g, "Math.PI");


    s = s.replace(/\be\b/g, "Math.E");

    s = s.replace(/\bsin\(/g, "sinf(")
         .replace(/\bcos\(/g, "cosf(")
         .replace(/\btan\(/g, "tanf(")
         .replace(/\bln\(/g,  "lnf(")
         .replace(/\blog\(/g, "log10(")
         .replace(/\bsqrt\(/g,"sqrtf(");

    // Factorial: turn n! into fact(n). Only integers supported.
    // Handles multiple occurrences like 5!*3! etc.
    s = s.replace(/(\d+)!/g, "fact($1)");

    // Percent already transformed by button; handle stray cases anyway.
    s = s.replace(/(\d+(\.\d+)?)%/g, "($1/100)");

    // Whitelist check: only allowed characters after transform
    const allowed = /^[\d+\-*/().,%\sA-Za-z_][\d+\-*/().,%\sA-Za-z_0-9]*$/;
    if (!allowed.test(s)) throw new Error("Invalid characters in expression.");

    return s.trim();
  }

  function evaluateExpr(){
    if (!expr) { setAns("= 0"); return; }
    try{
      const jsExpr = transformExpression(expr);
      // Evaluate safely in a limited scope with Function
      const result = Function(
        "sinf","cosf","tanf","lnf","log10","sqrtf","fact","Math",
        `"use strict"; return (${jsExpr});`
      )(sinf, cosf, tanf, lnf, log10, sqrtf, fact, Math);

      const out = Number.isFinite(result) ? roundSmart(result) : String(result);
      setAns("= " + out);
    }catch(err){
      setAns("Error");
      console.error(err);
    }
  }

  function roundSmart(n){
    // Keep results readable
    if (Math.abs(n) < 1e-9) return "0";
    const str = Math.abs(n) >= 1e9 || Math.abs(n) < 1e-4
      ? n.toExponential(6)
      : n.toFixed(10);
    // strip trailing zeros
    return str.replace(/(\.\d*?[1-9])0+$/,"$1").replace(/\.0+$/,"");
  }
})();

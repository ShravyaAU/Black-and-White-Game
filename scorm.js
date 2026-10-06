/**
 * SCORM API Wrapper
 * Handles LMS integration for both SCORM 1.2 and SCORM 2004.
 * Falls back gracefully to localStorage when running in standalone mode.
 */

const SCORM = (function () {
  let api = null;
  let scormVersion = null; // "1.2" or "2004"
  let isInitialized = false;

  function findAPI(win) {
    let attempts = 0;
    const maxAttempts = 10;
    while (win && attempts < maxAttempts) {
      if (win.API_1484_11) {
        scormVersion = "2004";
        return win.API_1484_11;
      }
      if (win.API) {
        scormVersion = "1.2";
        return win.API;
      }
      if (win.parent && win.parent !== win) {
        win = win.parent;
      } else if (win.opener) {
        win = win.opener;
      } else {
        break;
      }
      attempts++;
    }
    return null;
  }

  function init() {
    if (isInitialized) return true;
    api = findAPI(window);

    if (api) {
      try {
        if (scormVersion === "2004") {
          const res = api.Initialize("");
          isInitialized = res === "true" || res === true;
        } else {
          const res = api.LMSInitialize("");
          isInitialized = res === "true" || res === true;
        }
        console.log(`[SCORM] Initialized SCORM ${scormVersion} API`);
      } catch (e) {
        console.warn("[SCORM] Initialization exception:", e);
      }
    } else {
      console.log("[SCORM] Standalone mode (No LMS API found). Using LocalStorage.");
      isInitialized = true;
    }
    return isInitialized;
  }

  function setScore(score, maxScore = 100, minScore = 0) {
    if (!isInitialized) init();
    
    // Always save to localStorage as backup
    localStorage.setItem("gra121_scorm_score", score);
    localStorage.setItem("gra121_scorm_max", maxScore);

    if (!api) return;

    try {
      if (scormVersion === "2004") {
        const scaledScore = (score / maxScore).toFixed(2);
        api.SetValue("cmi.score.scaled", scaledScore);
        api.SetValue("cmi.score.raw", score.toString());
        api.SetValue("cmi.score.min", minScore.toString());
        api.SetValue("cmi.score.max", maxScore.toString());
      } else {
        api.LMSSetValue("cmi.core.score.raw", score.toString());
        api.LMSSetValue("cmi.core.score.min", minScore.toString());
        api.LMSSetValue("cmi.core.score.max", maxScore.toString());
      }
      save();
    } catch (e) {
      console.warn("[SCORM] SetScore error:", e);
    }
  }

  function setCompletion(status = "completed") {
    if (!isInitialized) init();

    localStorage.setItem("gra121_scorm_completion", status);

    if (!api) return;

    try {
      if (scormVersion === "2004") {
        api.SetValue("cmi.completion_status", status);
        api.SetValue("cmi.success_status", status === "completed" ? "passed" : "unknown");
      } else {
        api.LMSSetValue("cmi.core.lesson_status", status);
      }
      save();
    } catch (e) {
      console.warn("[SCORM] SetCompletion error:", e);
    }
  }

  function save() {
    if (!api) return;
    try {
      if (scormVersion === "2004") {
        api.Commit("");
      } else {
        api.LMSCommit("");
      }
    } catch (e) {
      console.warn("[SCORM] Commit error:", e);
    }
  }

  function finish() {
    if (!isInitialized || !api) return;
    try {
      if (scormVersion === "2004") {
        api.Terminate("");
      } else {
        api.LMSFinish("");
      }
      isInitialized = false;
    } catch (e) {
      console.warn("[SCORM] Terminate error:", e);
    }
  }

  return {
    init,
    setScore,
    setCompletion,
    save,
    finish
  };
})();

// Backward compatibility helper functions matching Color Game script expectations
function scormInit() { return SCORM.init(); }
function scormSetScore(score, maxScore) { SCORM.setScore(score, maxScore); }
function scormSetCompletion(status) { SCORM.setCompletion(status); }
function scormSave() { SCORM.save(); }

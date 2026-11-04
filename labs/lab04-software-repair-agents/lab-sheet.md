# Lab 04: Building and Evaluating AI Software Repair Agents

**Duration:** 2 hours  
**Tools:** browser notebook, Python (Pyodide), TypeScript compiler, Gemini API, report workspace

## Scenario
A TypeScript service has three outstanding defects involving checkout totals, incident priority and request-header redaction. Implement two Python agents that attempt to repair these defects. Compare a reactive one-pass strategy with a feedback-driven strategy that may inspect compiler errors or test failures and revise the patch.

## Instructions
1. Open **Notebook**. Select each issue, read the affected source file and compile the original program.
2. Implement and run **select_context**. Check that invalid paths are rejected.
3. Implement and run **reactive_agent**. It must make one generation attempt and stop.
4. Implement and run **intelligent_agent**. It must stop on success or when three attempts are exhausted.
5. Open Google AI Studio, create a Gemini API key and test it in the notebook. The key is not saved.
6. Run both agents on the selected case. Inspect the generated patch and compile/test log.
7. Select **Run all three cases** to execute six independent agent trials. The batch starts a fresh results table and continues if one API request fails. Use the repetition selector for additional trials, then inspect the per-issue results.
8. Complete the Python data-analysis cell and open **Report** to prepare your findings.

**Use the hints when needed.** Each editable Python cell has a three-question checkpoint before its full-code hint is revealed. Questions and answer order change between retries, and retries are unlimited. The report should still explain what your program does and what happened when you executed it.

## Evaluation
Report task success, measured end-to-end runtime, messages and JSON bytes exchanged with the isolated test worker, and model token counts. These are different costs. Use your execution records. API and execution errors are recorded but excluded from repair-success percentages. Use **Clear measurements** after reviewing old runs, then repeat the experiments. Run the analysis cell to generate the overall and per-issue tables and five figures from the same CSV content that can be exported.

## Interpreting a 100% result
If both agents fix a case on their first attempt, the intelligent agent has not had to revise a failed patch. This is a legitimate experimental outcome. Examine runtime, communication, model use and the number of retries. Complete all three cases before drawing conclusions. Report a ceiling effect when both strategies succeed on every observed trial, rather than claiming an advantage that was not measured.

# How can AI help us fix software?

Imagine you work on a software team. Someone reports that part of an application is not working. You must find the problem, change the code, and check whether the change works.

In this lab, you will write Python functions that control how an AI coding model tries to repair software. You will compare two ways of making repair decisions.

## 1. The three software problems

**Checkout:** A function should return a total in cents as a number, but it returns text instead. The TypeScript compiler finds the mistake.

**Queue:** The program chooses older routine tickets before newer critical incidents. The code compiles, but a test shows that the ticket order is wrong.

**Security:** The program is meant to hide access keys and other private values before writing request logs. Its current checks miss some header names.

These are small teaching examples. They were written for the lab and were not taken from production incidents. The code is genuinely compiled and tested in the browser.

## 2. What the AI does

A coding model such as Gemini receives the problem report, the source code, and a message explaining what failed. It returns a proposed corrected file.

The proposed code may still be wrong. We compile and test it before deciding whether the repair succeeded.

The generated file is a *software artifact*, which simply means a file produced during software development.

## 3. What the two agents do

**Reactive agent:** Ask for one patch, compile it, and run the tests. If it fails, stop.

**Intelligent agent:** Ask for a patch, compile it, and run the tests. If it fails, send the failure information back and ask for another patch. Stop after success or at most three generated patches.

Both agents use the same coding model. Students are writing the decision rules around the model, not training a new AI model.

## 4. What you write in Python

- `select_context()` finds the affected source file and returns its contents.
- `reactive_agent()` decides whether to ask for the first patch or stop.
- `intelligent_agent()` uses the latest compiler or test results to decide whether another attempt is needed.
- `summarize_runs()` calculates success rates and average measurements after the experiments.

Each code cell has a Run button. You can unlock a full-code example by correctly answering three questions about that cell.

## 5. Why compilation and tests matter

Compilation checks whether the TypeScript code follows the programming language's rules.

Tests check whether the program does the right thing. A program may compile successfully and still choose the wrong ticket or expose a secret in its logs.

A repair is successful only when the generated source compiles and all checks for that case pass.

## 6. What we measure

We compare whether each repair succeeded, how many patches were attempted, total time, test-worker messages and data exchanged, and Gemini token use.

Worker communication measures messages exchanged with the browser program that runs tests. It does not include all Gemini network traffic. Tokens are not the same as bytes.

Both agents can succeed on their first attempt. If so, the intelligent agent never needed to revise its patch. Report what actually happened rather than assuming that more attempts always produce better results.

## 7. Your report

Explain what the three software problems were, how your Python agents made decisions, what the test results showed, and what the comparison tells you. Include the measured results and figures. Discuss one real failure or limitation from your experiment.

After reading, open **Notebook** and begin with the checkout case.

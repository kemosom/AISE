# AI Software Repair Agents

A reactive agent follows a fixed repair procedure. It reads an issue, asks a coding model for a patch, compiles it and stops. An intelligent repair agent uses the compiler and regression-test feedback to decide whether to revise its patch. Both receive the same model and starting source. Their difference is in decision behaviour and the available repair attempts.

The generated artifact in this lab is a complete replacement TypeScript source file. Code generation and software verification are separate steps. A syntactically valid or successfully compiled patch can still fail behavioural tests.

The experiment measures issue resolution, total elapsed time, JSON tool-exchange messages and bytes, and model token usage. More attempts may improve the repair rate but also consume additional computation and communication.

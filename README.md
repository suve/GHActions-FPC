# GHAction for the Free Pascal Compiler

This GitHub Action allows you to compile Pascal programs using the Free Pascal Compiler.

## Inputs

| Name     | Required | Description            | Default     |
| -------- | :------: | ---------------------- | ----------- |
| `fpc`    |          | FPC executable to use. | _see below_ |
| `flags`  |          | Flags passed to FPC.   |             |
| `source` | Yes      | Main source file.      |             |

The `fpc` input can be used to provide a full path to the Free Pascal Compiler executable.
When omitted, the Action behaves as follows:
- On Linux/MacOS: use `fpc`, i.e. rely on the executable being somewhere in `$PATH`.
- On Windows: the following list of directories is checked in search of an existing FPC installation.
  `X.Y.Z` stands for the version number of fpc. If multiple versions are found, the latest is preferred.
  * `C:\fpc\X.Y.Z`
  * `C:\Program Files\fpc\X.Y.Z`
  * `C:\lazarus\fpc\X.Y.Z`
  * `C:\Program Files\lazarus\fpc\X.Y.Z`

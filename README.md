# GHAction for the Free Pascal Compiler

This GitHub Action allows you to compile Pascal programs using the Free Pascal Compiler.
It will parse the compiler's diagnostics and create annotations on your commits and pull requests.

## Inputs

| Name        | Required | Description            | Default     |
| ----------- | :------: | ---------------------- | ----------- |
| `fail-on`   |          | Strictness level.      | `e`         |
| `fpc`       |          | FPC executable to use. | _see below_ |
| `flags`     |          | Flags passed to FPC.   |             |
| `source`    | Yes      | Main source file.      |             |
| `verbosity` |          | Verbosity level.       | `ew`        |
| `workdir`   |          | Working directory.     |             |

### fail-on

The `fail-on` input can be used to control when the Action should fail.
By default, the Action will fail only if an error occurs (or if the compiler crashes).
If you want to be more strict with your code, you can use this option to have the Action
mark itself as "failed" when any warnings occur.

With a C compiler, you could use the `-Werror` compiler option to have the compiler treat any
warnings as errors; however, FPC does not have an equivalent option.

The value for this input follows the same rules as the one for `verbosity`.
Note that setting this input does **not** affect `verbosity` - if you use `ew` for `fail-on`,
you **must** have `ew` in your verbosity settings.

### fpc

The `fpc` input can be used to provide a full path to the Free Pascal Compiler executable.
When omitted, the Action behaves as follows:
- On Linux/MacOS: use `fpc`, i.e. rely on the executable being somewhere in `$PATH`.
- On Windows: the following list of directories is checked in search of an existing FPC installation.
  `X.Y.Z` stands for the version number of fpc. If multiple versions are found, the latest is preferred.
  * `C:\fpc\X.Y.Z`
  * `C:\Program Files\fpc\X.Y.Z`
  * `C:\Program Files (x86)\fpc\X.Y.Z`
  * `C:\lazarus\fpc\X.Y.Z`
  * `C:\Program Files\lazarus\fpc\X.Y.Z`
  * `C:\Program Files (x86)\lazarus\fpc\X.Y.Z`

### verbosity

The `verbosity` input can be used to control the desired verbosity level.
The value can be any combination of the following letters:
- `e` for errors
- `w` for warnings
- `n` for notes
- `h` for hints

Note that these are "precise", i.e. a value of `n` will result in just the notes being printed,
without errors or warnings. You need `ewn` (or `new`, the order doesn't matter) if you want all three.

Implementation-wise, the flags passed to the Free Pascal compiler are `-v0 -vibXXX`,
where `XXX` is the value for this input.
As such, if you want to set the verbosity level through the `flags` input,
you **need** to set this input to an empty string - this disables adding the two `-v` flags.

## Getting FPC

This Action assumes that FPC is already installed in your build environment; it does not handle
installing it for you. The minimum required version is 2.1.2 (released March 2007).

You can install FPC yourself by adding one of the following steps to your GHActions workflow.

### Ubuntu

```
- name: Install FPC
  run: |
    export DEBIAN_FRONTEND=noninteractive
    sudo apt-get update
    sudo apt-get install -y fpc
```

### MacOS

```
- name: Install FPC
  run: |
    brew update
    brew install fpc
```

### MS Windows

As of the time of writing, Chocolatey does not have a separate package for FPC,
so you'll have to install Lazarus instead (it comes with a bundled copy of the compiler).

```
- name: Install Lazarus
  run: |
    choco install lazarus
```

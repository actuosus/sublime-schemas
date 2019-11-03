# [Sublime Text](https://www.sublimetext.com/) configuration files [JSON schemas](http://json-schema.org)
All JSON schemas based on [Draft 07](http://json-schema.org/draft-07/schema) Core meta-schema.

Write and vadidate Sublime Text related configuration files in editors that supports JSON Schema (JetBrains, [Visual Studio Code](https://code.visualstudio.com/docs/languages/json#_json-schemas-and-settings)).

This schemas can help configure Sublime Text project and settings for your fellow collegues that use Sublime Text editor and you work on that together.


## [Sublime Settings](./src/schemas/json/sublime-settings.schema.json)
[Settings JSON Schema](https://www.sublimetext.com/docs/3/settings.html)
[Official Settings Documentation](http://docs.sublimetext.info/en/latest/customization/settings.html)

Relates to conversion from [Sublime Text settings to Visual Studio Code settings](https://github.com/Microsoft/vscode-sublime-keybindings).

### Usage

#### Visual Studio Code

Add to .vscode/settings.json:

```json
{
    "json.schemas": [
        {
            "fileMatch": [
                "/**/*.sublime-settings"
            ],
            "url": "https://raw.githubusercontent.com/actuosus/sublime-schemas/master/src/schemas/json/sublime-settings.schema.json"
        }
    ]
}
```


## [Sublime Project](https://www.sublimetext.com/docs/3/projects.html)

[Project JSON Schema](./src/schemas/json/sublime-project.schema.json)

[Official Project Documentation](http://docs.sublimetext.info/en/latest/file_management/projects.html)

### Usage

#### Visual Studio Code

Add to .vscode/settings.json:

```json
{
    "json.schemas": [
        {
            "fileMatch": [
                "/**/*.sublime-project"
            ],
            "url": "https://raw.githubusercontent.com/actuosus/sublime-schemas/master/src/schemas/json/sublime-project.schema.json"
        }
    ]
}
```


## [Sublime Workspace](./src/schemas/json/sublime-workspace.schema.json)

[Workspace JSON Schema](./src/schemas/json/sublime-workspace.schema.json)

[Official Workspace Documentation](http://docs.sublimetext.info/en/latest/file_management/projects.html#workspaces)

### Usage

#### Visual Studio Code

Add to .vscode/settings.json:

```json
{
    "json.schemas": [
        {
            "fileMatch": [
                "/**/*.sublime-workspace"
            ],
            "url": "https://raw.githubusercontent.com/actuosus/sublime-schemas/master/src/schemas/json/sublime-workspace.schema.json"
        }
    ]
}
```


## [Sublime Build System](./src/schemas/json/sublime-build.schema.json)

[Build System JSON Schema](./src/schemas/json/sublime-build.schema.json)

[Official Workspace Documentation](https://www.sublimetext.com/docs/3/build_systems.html)

### Usage

#### Visual Studio Code

Add to .vscode/settings.json:

```json
{
    "json.schemas": [
        {
            "fileMatch": [
                "/**/*.sublime-build"
            ],
            "url": "https://raw.githubusercontent.com/actuosus/sublime-schemas/master/src/schemas/json/sublime-build.schema.json"
        }
    ]
}
```

## Intermediate Schema Generation

### Install Node.js

https://nodejs.org/en/download/package-manager/

### Generate

```shell
npm run generate-settings
```

## To Do

* prepare to contribute to [JSON Schema Store](http://schemastore.org/json/)
* project configuration sync with VS Code (extension?)
* project configuration sync with JetBrains (plugin?)

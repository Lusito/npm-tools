# @lusito/mono-docs

A static documentation generator targeted at normal and monorepo code repositories.

I started this project since vuepress broke on newer node.js versions and I felt like tackling the issues I had with it.

Other code generators make your documentation source to feel a bit out of place. I'd like the documentation to feel as native to a code repository as possible. All documentation will stay in the respective projects directory structure and the configuration for it stays in yaml files. It was originally planned to stay in the front-matter, but since github shows front-matter when displaying markdown, this made everything too ugly.

I'm not sure yet if this will become a public tool, which can be adjusted to your liking or just a tool specific for my projects and design.
In theory, it could be easily themeable, as I'm using JSX syntax via [tsx-dom-ssr](https://github.com/Lusito/tsx-dom/) to generate the HTML.
If you feel like this might be something for your projects, give me a heads up.

## License

@lusito/mono-docs has been released under the [MIT](./LICENSE) license, meaning you
can use it free of charge, without strings attached in commercial and non-commercial projects. Credits are appreciated but not mandatory.

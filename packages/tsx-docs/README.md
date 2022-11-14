# tsx-docs

A static documentation generator targeted at normal and monorepo code repositories.

I started this project since vuepress broke on newer node.js versions and I felt like tackling the issues I had with it.

Other code generators make your documentation source to feel a bit out of place. I'd like the documentation to feel as native to a code repository as possible. All documentation will stay in the respective projects directory structure and the configuration for it stays in the frontmatter of your markdown files.

I'm not sure yet if this will become a public tool, which can be adjusted to your liking or just a tool specific for my projects and design.
In theory, it could be easily themeable, as I'm using JSX syntax via [tsx-dom-ssr](https://github.com/Lusito/tsx-dom/) to generate the HTML.
If you feel like this might be something for your projects, give me a heads up.

## Report Issues

Something not working quite as expected? Do you need a feature that has not been implemented yet? Check the [issue tracker](https://github.com/Lusito/tsx-docs/issues) and add a new one if your problem is not already listed. Please try to provide a detailed description of your problem, including the steps to reproduce it.

## Contribute

Awesome! If you would like to contribute with a new feature or submit a bugfix, fork this repo and send a pull request. Please, make sure all the unit tests are passing before submitting and add new ones in case you introduced new features.

## License

tsx-docs has been released under the [MIT](https://github.com/Lusito/tsx-docs/blob/master/LICENSE) license, meaning you
can use it free of charge, without strings attached in commercial and non-commercial projects. Credits are appreciated but not mandatory.

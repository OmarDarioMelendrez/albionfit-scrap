# scraper

> TODO: description

## Running the scraper as a script

Use the file

1. Run `yarn install` in the scraper repository root
2. Edit `run/urls.yml` to specify urls to scrape for each provider. Naming a provider starting with a `.` will cause all its urls to be ignored
3. Run `yarn scrape` to start scraping!
4. Results are gonna be output in `./run/{provider}-{date}-batch{number}.json`

Alternative you can run using the launch option in `VSCode` (And it will attach the debuger!)

### Running in headless mode

In order to run the stack as headless you'll need to set up a .env like the following:

```bash
# .env
HEADLESS=true
```

## Create an scraper

1. Run `yarn generate {name}`
2. Code the scraper in the generated file at `src/providers/{name}/scraper.ts`
3. Register your scraper by adding `export * as {name} from './{name}'` at `src/providers/index.ts`
4. Run your scraper! :)

## Environment Variables

The Scraper uses the following environment variables:

- `HEADLESS`: Wether to launch chromeium in headless mode or headful (with GUI). `false` by default

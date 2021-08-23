import IScraper from './scraper'

export default interface IProvider {
  name?: string
  scraper: IScraper
}

import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { Service } from 'typedi';
import DataLoader from 'dataloader';
import { Anime } from '../anime.type';
import { Genre } from '../../genre/genre.type';

@Service()
export class AnimeLoaders {
  constructor(@InjectRepository(Anime) private animeRepo: Repository<Anime>) {}

  batchGenreByAnimeIds = async (keys: readonly number[]): Promise<Genre[][]> => {
    const animes = await this.animeRepo
      .createQueryBuilder('anime')
      .leftJoinAndSelect('anime.genres', 'genres')
      .where('anime.id in (:...animeIds)', { animeIds: keys })
      .getMany();

    const formatedGenre = keys.map((key) => {
      const anime = animes.find((oneAnime) => {
        return oneAnime.id === key;
      });

      return anime ? anime.genres : [];
    });

    return formatedGenre;
  };

  batchFindById = async (keys: readonly number[]): Promise<(Anime | undefined)[]> => {
    const ids = [...keys];
    const animes = await this.animeRepo.findByIds(ids);

    const formatedAnime = keys.map((key) =>
      animes.find((anime) => {
        return anime.id === key;
      })
    );

    return formatedAnime;
  };

  createLoaders = () => {
    return {
      batchGenreByAnimeIds: new DataLoader<number, Genre[]>((keys) =>
        this.batchGenreByAnimeIds(keys)
      ),
      batchFindById: new DataLoader<number, Anime | undefined>((keys) => this.batchFindById(keys)),
    };
  };
}

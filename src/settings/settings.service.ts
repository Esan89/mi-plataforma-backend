import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './entities/setting.entity';
import { CreateSettingDto } from './dto/create-setting.dto';

@Injectable()
export class SettingsService {
    constructor(
        @InjectRepository(Setting)
        private readonly settingRepository: Repository<Setting>,
    ) { }

    async createOrUpdate(createSettingDto: CreateSettingDto): Promise<Setting> {
        const { key, value, description } = createSettingDto;
        let setting = await this.settingRepository.findOne({ where: { key } });

        if (setting) {
            setting.value = value;
            if (description) setting.description = description;
        } else {
            setting = this.settingRepository.create({ key, value, description });
        }

        return this.settingRepository.save(setting);
    }

    async findAll(): Promise<Setting[]> {
        return this.settingRepository.find();
    }

    async findOne(key: string): Promise<Setting> {
        const setting = await this.settingRepository.findOne({ where: { key } });
        if (!setting) {
            throw new NotFoundException(`Setting with key "${key}" not found`);
        }
        return setting;
    }

    async getValue(key: string): Promise<string | null> {
        const setting = await this.settingRepository.findOne({ where: { key } });
        return setting ? setting.value : null;
    }
}

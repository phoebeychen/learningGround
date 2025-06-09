# 

# 卡路里计算器开发文档



## 🎯 1. 核心功能需求 (Functional Requirements)

- 食物数据库管理 (CRUD):
  - **C (Create):** 如果食物不在数据库中，用户可以添加新食物条目，包括名称、热量（千卡）、蛋白质（克）、碳水化合物（克）和脂肪（克）。所有营养素均以 **每100克** 食物为单位。
  - **R (Read):** 用户可以按名称搜索食物数据库，实时看到匹配的食物列表。系统需要一个页面来展示和管理数据库中的所有食物。
  - **U (Update):** 用户可以修改数据库中已有食物的营养信息。
  - **D (Delete):** 用户可以从数据库中删除食物条目。
- 管理摄入记录 (Managing Entries):
  - 用户可以对当天已添加的饮食记录进行完整的CRUD操作，以修正错误或改变主意。
    - **C (Create):** 即“添加摄入记录”。
    - **R (Read):** 即“每日汇总”中展示的列表。
    - **U (Update):** 用户可以修改某条记录的克重，系统会重新计算并更新对应的 `FoodEntryDto`。
    - **D (Delete):** 用户可以从当天的记录中删除某一条目。

## 🛠️ 2. 技术栈 (Tech Stack)

- 后端 (Backend):
  - **语言:** Java 17+
  - **框架:** Spring Boot 3.x
  - **构建工具:** Gradle 8.5
  - **数据库:** PostgreSQL
  - **API:** RESTful API
- 前端 (Frontend):
  - **语言:** TypeScript
  - **框架:** React 18.x
- 开发环境:
  - **容器化:** Docker Compose

## 🏗️ 3. 架构设计 (Architecture)

### 后端 (Backend - Spring Boot)

### 目录结构

`calorie-calculator/`
`└── src/`
`└── main/`
`├── java/`
`│   └── com/`
`│       └── example/`
`│           └── caloriecalculator/`
`│               ├── controller/     // API层: 处理HTTP请求, 使用ResponseEntity`
`│               │   └── FoodController.java`
`│               │   └── FoodEntryController.java`
`│               ├── dto/            // 数据传输对象(DTO)`
`│               │   └── FoodDto.java`
`│               │   └── FoodEntryDto.java`
`│               ├── mapper/         // DTO与Model的转换层`
`│               │   └── FoodMapper.java`
`│               │   └── FoodEntryMapper.java`
`│               ├── model/          // 数据库实体 (JPA Entity)`
`│               │   ├── Food.java`
`│               │   └── FoodEntry.java`
`│               ├── repository/     // 数据访问层`
`│               │   ├── FoodRepository.java`
`│               │   └── FoodEntryRepository.java`
`│               └── service/        // 业务逻辑层`
`│                   └── FoodService.java`
`│                   └── FoodEntryService.java`
`└── resources/`
`└── application.properties  // 配置文件`

### 数据传输对象 (DTO)

为了实现API层和数据库实体层的解耦，我们将引入DTO和Mapper。

**1. `FoodDto.java`** 在当前需求下，我们主要处理的是`Food`实体。因此，我们创建`FoodDto`。我们将使用`org.immutables`库来定义一个不可变的DTO。

```java
package com.example.caloriecalculator.dto;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import org.immutables.value.Value;

@Value.Immutable // 核心注解，表明这是一个不可变对象
@JsonSerialize(as = ImmutableFoodDto.class) // Jackson序列化时使用的实现类
@JsonDeserialize(as = ImmutableFoodDto.class) // Jackson反序列化时使用的实现类
public interface FoodDto {
    Long getId();
    String getName();
    double getCalories();
    double getProtein();
    double getCarbs();
    double getFat();
}
```

1. **`FoodEntryDto.java`**

有时前端需要的数据，并不能直接从一个数据库实体中获得，而是需要经过**聚合和计算**。

例如，“今日饮食记录”不仅需要 `FoodEntry` 实体中的 `weight`（克重），还需要从关联的 `Food` 实体中获取 `foodName`，并根据这两个值**计算出**这一餐的实际摄入热量。

为此，我们创建了 `FoodEntryDto`。它是一个复合 DTO，既包含了直接映射的字段，也定义了需要由业务逻辑层（Service）计算并填充的字段。

```java
package com.example.caloriecalculator.dto;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import org.immutables.value.Value;
import java.time.LocalDate;

@Value.Immutable
@JsonSerialize(as = ImmutableFoodEntryDto.class)
@JsonDeserialize(as = ImmutableFoodEntryDto.class)
public interface FoodEntryDto {
    // 直接映射的字段
    Long getId();
    Long getFoodId();
    String getFoodName();
    double getWeight();
    LocalDate getEntryDate();

    // 由 Service 层计算后填充的字段
    double getCalories();
    double getProtein();
    double getCarbs();
    double getFat();
}
```

## 转换器 (Mapper)

**1. `FoodMapper.java`** 为了在`Food` (Model) 和 `FoodDto` 之间进行高效、无模板代码的转换，我们使用 **MapStruct** 库。

```java
package com.example.caloriecalculator.mapper;

import com.example.caloriecalculator.dto.FoodDto;
import com.example.caloriecalculator.model.Food;
import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring") // 声明为MapStruct的Mapper并集成到Spring容器
public interface FoodMapper {

    FoodMapper INSTANCE = Mappers.getMapper(FoodMapper.class);

    FoodDto foodToFoodDto(Food food);

    Food foodDtoToFood(FoodDto foodDto);
}
```

## Service 层

Service层将注入`FoodRepository`和`FoodMapper`，处理业务逻辑并返回DTO。

```java
// FoodService.java
@Service
public class FoodService {

    private final FoodRepository foodRepository;
    private final FoodMapper foodMapper;

    @Autowired
    public FoodService(FoodRepository foodRepository, FoodMapper foodMapper) {
        this.foodRepository = foodRepository;
        this.foodMapper = foodMapper;
    }

    public FoodDto createFood(FoodDto foodDto) {
        Food food = foodMapper.foodDtoToFood(foodDto);
        Food savedFood = foodRepository.save(food);
        return foodMapper.foodToFoodDto(savedFood);
    }

    // ... 其他业务逻辑方法，输入输出都使用FoodDto
}
```

### Controller 层

Controller层将使用`ResponseEntity`来完全控制HTTP响应，包括状态码、头部和响应体。响应体将是`FoodDto`。

Java

```java
// FoodController.java
@RestController
@RequestMapping("/api/foods")
public class FoodController {

    private final FoodService foodService;

    @Autowired
    public FoodController(FoodService foodService) {
        this.foodService = foodService;
    }

    @PostMapping
    public ResponseEntity<FoodDto> createFood(@RequestBody FoodDto foodDto) {
        FoodDto createdFood = foodService.createFood(foodDto);
        return new ResponseEntity<>(createdFood, HttpStatus.CREATED);
    }

    // ... 其他API端点，都返回ResponseEntity<T>
}
```

## 📦 4. 环境与构建配置

### Gradle 配置

**1. `build.gradle` (关键依赖)** 你需要添加Immutables和MapStruct的依赖及注解处理器配置。

```java
// build.gradle

plugins {
    // ...
}

// ...

dependencies {
    // Spring Boot Starters
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'

    // Database
    runtimeOnly 'org.postgresql:postgresql'

    // DTO & Mapper Libraries
    implementation 'org.mapstruct:mapstruct:1.5.5.Final'
    annotationProcessor 'org.mapstruct:mapstruct-processor:1.5.5.Final'
    compileOnly 'org.immutables:value:2.10.1'
    annotationProcessor 'org.immutables:value:2.10.1'

    // Lombok (Optional but recommended for models)
    compileOnly 'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'

    // ... test dependencies
}

// ...
```

**2. `gradle/wrapper/gradle-wrapper.properties`** 这是指定的配置，确保文件内容如下：

```java
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.5-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
```

### Docker Compose & PostgreSQL

为了简化开发环境的搭建，我们使用`docker-compose`来一键启动PostgreSQL数据库。

**1. `docker-compose.yml`** 在项目根目录下创建此文件：

```java
version: '3.8'

services:
  # PostgreSQL Database Service
  postgres-db:
    image: postgres:15
    container_name: calorie-postgres
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: caloriedb
    ports:
      - "5432:5432" # 将容器的5432端口映射到主机的5432端口
    volumes:
      - ./db/init.sql:/docker-entrypoint-initdb.d/init.sql # 挂载初始化脚本
      - postgres-data:/var/lib/postgresql/data # 持久化数据

volumes:
  postgres-data: # 定义一个数据卷来持久化数据库数据
```

**2. `db/init.sql`** 在项目根目录下创建`db`文件夹，并在其中创建`init.sql`文件。此脚本将在Docker容器第一次启动时自动执行。

```java
- 创建食物表
CREATE TABLE food ( id BIGSERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, calories DOUBLE PRECISION NOT NULL, protein DOUBLE PRECISION NOT NULL, carbs DOUBLE PRECISION NOT NULL, fat DOUBLE PRECISION NOT NULL
);
-- 创建每日记录表
CREATE TABLE food_entry ( id BIGSERIAL PRIMARY KEY, food_id BIGINT REFERENCES food(id), food_name VARCHAR(255), weight DOUBLE PRECISION NOT NULL, entry_date DATE NOT NULL
);
-- 插入一些初始的食物数据
INSERT INTO food (name, calories, protein, carbs, fat) VALUES
('Apple', 52, 0.3, 14, 0.2),
('Chicken Breast', 165, 31, 0, 3.6),
('White Rice (Cooked)', 130, 2.7, 28, 0.3),
('Broccoli', 55, 3.7, 11.2, 0.6),
('Egg', 155, 13, 1.1, 11);
```

**3. `src/main/resources/application.properties`** 更新Spring Boot的配置文件，使其连接到Docker中的PostgreSQL数据库。

```java
# PostgreSQL Database Connection
spring.datasource.url=jdbc:postgresql://localhost:5432/caloriedb
spring.datasource.username=user
spring.datasource.password=password
spring.datasource.driver-class-name=org.postgresql.Driver

# JPA/Hibernate Settings
spring.jpa.hibernate.ddl-auto=validate # 我们用init.sql管理schema，所以这里设置为validate
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
```

### **启动开发环境**

1. **启动数据库:** 在项目根目录下，打开终端，运行 `docker-compose up -d`。这将会在后台启动PostgreSQL容器。
2. **启动后端服务:** 在你的IDE中运行Spring Boot应用程序。它将自动连接到Docker中的数据库。

🗺️开发路线图

1. 环境搭建:
   - 编写 `docker-compose.yml` 和 `db/init.sql`。
   - 运行 `docker-compose up` 启动数据库并验证数据已初始化。
2. 后端开发:
   - 使用 `start.spring.io` 生成项目，并更新 `build.gradle` 和 `gradle-wrapper.properties`。
   - 定义 `model` 层的 `Food` 和 `FoodEntry` 实体。
   - 定义 `dto` 层的 `FoodDto` 接口 (使用Immutables)。
   - 定义 `mapper` 层的 `FoodMapper` 接口 (使用MapStruct)。
   - 实现 `repository` 接口。
   - 在 `service` 层注入 `repository` 和 `mapper`，编写业务逻辑。
   - 在 `controller` 层注入 `service`，创建返回 `ResponseEntity<FoodDto>` 的API端点。
   - 使用Postman测试所有API。
3. 前端开发:
   - 创建React + TS项目，搭建组件，并通过`apiService`调用后端API。
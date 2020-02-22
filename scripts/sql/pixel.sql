-- phpMyAdmin SQL Dump
-- version 4.9.2
-- https://www.phpmyadmin.net/
--
-- 主机： localhost
-- 生成日期： 2020-02-22 11:02:52
-- 服务器版本： 5.6.44-log
-- PHP 版本： 7.4.2

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- 数据库： `pixel`
--

-- --------------------------------------------------------

--
-- 表的结构 `map`
--

CREATE TABLE `map` (
  `x` int(11) NOT NULL COMMENT '坐标x',
  `y` int(11) NOT NULL COMMENT '坐标y',
  `z` smallint(6) NOT NULL COMMENT '坐标z高度(地下/地面/天空)',
  `d` smallint(6) NOT NULL COMMENT '维度',
  `t` tinyint(4) NOT NULL COMMENT '类型(地图/家园/副本/房间/梦境)',
  `l` tinyint(4) NOT NULL COMMENT '层级(地形/管道/线路/地板/物体/屋顶/电量/魔力/污染/压力)',
  `value` int(11) NOT NULL COMMENT '物体/数值编号',
  `damage` smallint(5) UNSIGNED NOT NULL DEFAULT '0' COMMENT '耐久/损血/进度',
  `meta` text COMMENT 'meta数据，存储luatable序列化文本',
  `expire` int(11) NOT NULL COMMENT '刷新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- 转储表的索引
--

--
-- 表的索引 `map`
--
ALTER TABLE `map`
  ADD PRIMARY KEY (`x`,`y`,`z`,`d`,`t`,`l`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
